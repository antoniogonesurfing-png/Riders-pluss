"""End-to-end browser test for Riders Plus (mobile 390px). Run with the server on PORT (default 4310):
    /home/box/pwenv/bin/python tests/e2e.py
Saves screenshots to screenshots/ and prints a PASS/FAIL report."""
import asyncio, os, re, sys, time, json
from playwright.async_api import async_playwright, expect

BASE = os.environ.get("BASE", "http://localhost:4310")
ADMIN = dict(re.findall(r"^(Email|Password):\s+(\S+)", open(os.path.join(os.path.dirname(__file__), "..", "ADMIN_CREDENTIALS.txt")).read(), re.M))
SHOTS = os.path.join(os.path.dirname(__file__), "..", "screenshots")
os.makedirs(SHOTS, exist_ok=True)
results, errors, wide = [], [], []

def ok(name, cond, extra=""):
    results.append((name, bool(cond), extra)); print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra else ""))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on("console", lambda m: m.type in ("error", "warning") and errors.append(f"{m.type}: {m.text} @ {pg.url}"))
        pg.on("pageerror", lambda e: errors.append(f"PAGEERROR {e} @ {pg.url}"))
        pg.on("response", lambda r: r.status >= 400 and "/api/" not in r.url and errors.append(f"HTTP {r.status} {r.url}"))

        async def check_width(label):
            sw = await pg.evaluate("document.documentElement.scrollWidth")
            if sw > 390: wide.append(f"{label}: {sw}px")
        async def shot(name, full=False):
            await pg.wait_for_timeout(400)
            await check_width(name)
            await pg.screenshot(path=os.path.join(SHOTS, f"{name}.png"))
            if full:  # extra full-length capture with fixed bars hidden so they don't repeat mid-page
                await pg.add_style_tag(content=".tabbar,.fab,.header{position:static!important}")
                await pg.screenshot(path=os.path.join(SHOTS, f"{name}-full.png"), full_page=True)
                await pg.evaluate("document.querySelectorAll('style').forEach(s=>{if(s.textContent.includes('.tabbar,.fab,.header'))s.remove()})")
        async def go(path):
            await pg.goto(BASE + path, wait_until="networkidle")

        # Home + mobile menu
        await go("/")
        ok("home banner visible", await pg.get_by_test_id("event-banner").is_visible())
        ok("banner mailto", await pg.locator('a[href^="mailto:info@ridewithusretreats.com"]').count() > 0)
        await shot("01-home", full=True)
        await pg.get_by_role("button", name="Open menu").click()
        ok("mobile menu opens", await pg.get_by_role("dialog", name="Menu").is_visible())
        await shot("02-mobile-menu")
        await pg.get_by_role("dialog", name="Menu").get_by_role("link", name="Retreats", exact=True).click()
        await pg.wait_for_url("**/retreats")
        ok("menu link navigates", pg.url.endswith("/retreats"))

        # Search by place
        await go("/search?q=&where=Lanzarote")
        await pg.wait_for_selector('[data-testid=search-summary]')
        cards = await pg.locator('[data-testid=event-card]').all_inner_texts()
        ok("search filters by place (Lanzarote)", len(cards) > 0 and all("Lanzarote" in c or "Graciosa" in c for c in cards), f"{len(cards)} results")
        await go("/search?q=surf&where=Fuerteventura")
        txt = await pg.locator("main").inner_text()
        ok("search surf in Fuerteventura has no Portugal/Italy results", "Ericeira" not in txt and "Italy" not in txt)

        # Events page
        await go("/events")
        await pg.wait_for_selector('[data-testid=events-count]')
        titles = await pg.locator('[data-testid=event-card] h3').all_inner_texts()
        ok("events Nov 2026 Fuerteventura listed", len(titles) > 5, f"{len(titles)} events")
        ok("no repeated listings", len(titles) == len(set(titles)))
        await shot("03-events", full=True)
        await pg.select_option('[data-testid=island-select]', "All")
        await pg.locator('[data-month="2027-02"]').click(); await pg.wait_for_timeout(600)
        t = await pg.locator("main").inner_text()
        ok("Date to be confirmed label shown", "Date to be confirmed" in t)
        await pg.get_by_label("Free only").click(); await pg.wait_for_timeout(800)
        cards = await pg.locator('[data-testid=event-card]').all_inner_texts()
        ok("free-only toggle", all("Free" in c for c in cards), f"{len(cards)} free")

        # Sign up
        email = f"tester{int(time.time())}@example.com"
        await go("/signup")
        f = pg.get_by_test_id("signup-form")
        await f.locator('[name=name]').fill("Test Rider")
        await f.locator('[name=email]').fill(email)
        await f.locator('[name=password]').fill("SurfTest2026!")
        await f.locator('[name=birthdate]').fill("1990-05-05")
        await f.get_by_role("button", name="Surf", exact=True).click()
        await f.get_by_role("button", name="Kitesurf", exact=True).click()
        await f.locator('[name=acceptTerms]').check()
        await f.locator('[name=marketingOptIn]').check()
        await f.get_by_role("button", name="Create free account").click()
        await pg.wait_for_url("**/riders")
        ok("sign up -> riders", "/riders" in pg.url)

        # Find your rider
        await pg.wait_for_selector('[data-testid=swipe-card]')
        for _ in range(10):  # skip any real (non-bot) test accounts left from earlier runs
            if "(Bot)" in await pg.get_by_test_id("card-name").inner_text(): break
            await pg.get_by_test_id("btn-down").click(); await pg.wait_for_timeout(700)
        ok("bot badge on card", await pg.get_by_test_id("bot-badge").is_visible())
        name = await pg.get_by_test_id("card-name").inner_text()
        ok("bot name has (Bot)", "(Bot)" in name, name)
        left0 = await pg.get_by_test_id("swipes-left").inner_text()
        ok("Basic swipe counter shows limit of 20", "of 20 swipes left" in left0, left0)
        n0 = int(left0.split()[0])
        await shot("04-find-your-rider")
        await pg.get_by_test_id("btn-profile").click(); await pg.wait_for_selector("h1")
        ok("bot profile shows Test bot", "TEST BOT" in (await pg.locator("main").inner_text()).upper())
        await shot("05-bot-profile")
        await pg.go_back(); await pg.wait_for_selector('[data-testid=swipe-card]')
        # locked filter -> plus sheet
        await pg.get_by_test_id("filters-btn").click()
        await pg.get_by_test_id("filter-level-locked").click()
        sheet = pg.get_by_role("dialog", name="Upgrade coming soon")
        ok("Plus upgrade sheet opens from locked filter", await sheet.is_visible())
        await shot("06-plus-upgrade-sheet")
        await pg.get_by_test_id("plus-notify").click()
        await pg.wait_for_selector('[data-testid=plus-on-list]')
        ok("Plus notify-me saved", True)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        # pass one, like next
        await pg.get_by_test_id("btn-down").click(); await pg.wait_for_timeout(700)
        name2 = await pg.get_by_test_id("card-name").inner_text()
        await pg.get_by_test_id("btn-up").click()
        await pg.wait_for_selector('[data-testid=match-sheet]')
        ok("mutual like creates match with bot", True, name2)
        left1 = await pg.get_by_test_id("swipes-left").inner_text()
        ok("swipe counter decrements", int(left1.split()[0]) == n0 - 2, left1)
        await shot("07-match")
        await pg.get_by_test_id("open-chat").click()
        await pg.wait_for_selector('[data-testid=msg-them]')
        first = await pg.get_by_test_id("msg-them").first.inner_text()
        ok("bot first message disclaimer", "Hi guys, I'm a bot. I'm here so you can test the functionality of the app." in first)
        await pg.get_by_test_id("chat-input").fill("Hi! Where do you usually ride?")
        await pg.get_by_test_id("chat-send").click()
        typing_seen = False
        try:
            await pg.wait_for_selector('[data-testid=typing]', timeout=1500); typing_seen = True
        except Exception: pass
        ok("typing indicator shown", typing_seen)
        await pg.wait_for_function("document.querySelectorAll('[data-testid=msg-them]').length >= 2", timeout=8000)
        reply = await pg.get_by_test_id("msg-them").nth(1).inner_text()
        ok("bot replies", len(reply) > 10, reply[:80])
        await shot("08-chat-with-bot")

        # Post a paid event -> test checkout
        EV = f"Sunset Beach Session {int(time.time()) % 10000}"
        await go("/events/new")
        f = pg.get_by_test_id("post-event-form")
        await f.locator('[name=title]').fill(EV)
        await f.locator('[name=category]').select_option("Sport")
        await f.locator('[name=date]').fill("2026-11-21")
        await f.locator('[name=time]').fill("17:30")
        await f.locator('[name=place]').fill("Flag Beach, Corralejo")
        await f.locator('[name=island]').select_option("Fuerteventura")
        await pg.get_by_test_id("paid-toggle").click()
        await f.locator('[name=price]').fill("12")
        await f.locator('[name=listingFee]').fill("4")
        await f.locator('[name=description]').fill("Sunset surf session with a beach BBQ afterwards. Test event from the e2e run.")
        under = await f.locator('[name=listingFee]').evaluate("el => el.validity.rangeUnderflow")
        ok("listing fee under €5 blocked in form (server check covered in api test)", under)
        await f.locator('[name=listingFee]').fill("5")
        await f.locator('[name=featuredBoost]').check()
        ok("total includes featured boost", "€20.00" in await pg.get_by_test_id("total-due").inner_text())
        await shot("09-post-event", full=True)
        await f.get_by_role("button", name=re.compile("Continue to checkout")).click()
        await pg.wait_for_url("**/checkout/**")
        await pg.wait_for_selector("[data-testid=test-mode-banner]")
        ok("test mode banner", await pg.get_by_test_id("test-mode-banner").is_visible())
        await shot("10-test-checkout")
        await pg.get_by_test_id("pay-btn").click()
        await pg.wait_for_selector('[data-testid=payment-success]')
        ok("test payment -> approval queue", "approval queue" in await pg.get_by_test_id("payment-success").inner_text())
        await pg.get_by_role("link", name="View my listing").click()
        await pg.wait_for_selector('[data-testid=event-status]')
        ok("event pending before approval", "admin approval" in await pg.get_by_test_id("event-status").inner_text())
        await go("/events?month=2026-11")
        ok("pending event hidden from calendar", EV not in await pg.locator("main").inner_text())

        # Groms
        await go("/groms")
        ok("example grom cards labelled", (await pg.get_by_test_id("grom-example").count()) >= 2 and "Example profile, not a real person" in await pg.locator("main").inner_text())
        await shot("11-groms", full=True)
        g = pg.get_by_test_id("grom-form")
        await g.locator('[name=guardianName]').fill("Test Guardian")
        await g.locator('[name=guardianEmail]').fill("guardian@example.com")
        await g.locator('[name=gromFirstName]').fill("Testgrom")
        await g.locator('[name=gromAge]').fill("12")
        await g.locator('[name=story]').fill("E2E test nomination, not a real child.")
        await g.locator('[name=guardianIsAdult]').check()
        await g.get_by_role("button", name="Send nomination").click()
        await pg.wait_for_timeout(400)
        no_consent_blocked = await pg.get_by_test_id("nomination-sent").count() == 0
        ok("nomination blocked without guardian consent", no_consent_blocked)
        await g.locator('[name=guardianConsent]').check()
        await g.get_by_role("button", name="Send nomination").click()
        await pg.wait_for_selector('[data-testid=nomination-sent]')
        ok("grom nomination saved", True)
        await pg.get_by_test_id("sponsor-btn").click()
        await pg.wait_for_url("**/checkout/**")
        await pg.get_by_test_id("pay-btn").click()
        await pg.wait_for_selector('[data-testid=payment-success]')
        ok("grom sponsor test checkout", True)

        # Retreats
        await go("/retreats")
        n = await pg.get_by_test_id("retreat-card").count()
        ok("retreats listed", n >= 10, f"{n}")
        await shot("12-retreats", full=True)
        await go("/retreats/mentawai-silabu-surf-expedition")
        t = await pg.locator("main").inner_text()
        ok("Silabu detail shows €3,290 and dates", "€3,290" in t and "21 May – 4 June 2027" in t)
        await shot("13-retreat-detail", full=True)
        e = pg.get_by_test_id("enquiry-form")
        await e.locator('[name=phone]').fill("+34 600 000 000")
        await e.locator('[name=guests]').fill("2")
        await e.locator('[name=preferredDates]').select_option("4 – 18 June 2027")
        await e.locator('[name=message]').fill("E2E test enquiry, intermediate surfers.")
        await e.locator('[name=consent]').check()
        await e.get_by_role("button", name="Send request").click()
        await pg.wait_for_selector('[data-testid=enquiry-sent]')
        ok("retreat enquiry saved", True)
        await go("/providers/ride-with-us-retreats")
        ok("provider page lists all trips", await pg.get_by_test_id("retreat-card").count() == n)

        # Feedback
        await go("/events")
        await pg.get_by_test_id("feedback-fab").click()
        await pg.locator('textarea[name=message]').fill("E2E: test bug report from the events page.")
        await pg.get_by_role("button", name="Send", exact=True).click()
        await pg.wait_for_selector('[data-testid=feedback-done]')
        ok("feedback saved", True)
        await pg.keyboard.press("Escape")

        # Profile
        await go("/you")
        ok("profile shows Basic membership", "Basic" in await pg.get_by_test_id("membership-card").inner_text())
        await shot("14-profile", full=True)
        await go("/messages"); await shot("15-messages")

        # Admin
        await pg.get_by_role("button", name="Open menu").click()
        await pg.get_by_role("button", name="Log out").click(); await pg.wait_for_timeout(500)
        await go("/login")
        await pg.locator('[name=email]').fill(ADMIN["Email"]); await pg.locator('[name=password]').fill(ADMIN["Password"])
        await pg.get_by_role("button", name="Log in").click()
        await pg.wait_for_url("**/admin")
        await pg.wait_for_selector('[data-testid=admin-overview]')
        ov = await pg.get_by_test_id("admin-overview").inner_text()
        ok("admin overview shows tier limits", "Daily swipe limit" in ov and "20" in ov)
        await shot("16-admin-overview", full=True)
        await pg.get_by_role("tab", name=re.compile("Event queue")).click()
        item = pg.get_by_test_id("queue-item").filter(has_text=EV).first
        await item.wait_for()
        await shot("17-admin-queue")
        await item.get_by_test_id("approve-btn").click(); await pg.wait_for_timeout(600)
        for tab, tid in (("Grom nominations", "grom-row"), ("Retreat enquiries", "enquiry-row"), ("Feedback", "feedback-row")):
            await pg.get_by_role("tab", name=re.compile(tab)).click()
            await pg.wait_for_selector(f'[data-testid={tid}]')
            ok(f"admin sees {tab}", await pg.get_by_test_id(tid).count() > 0)
        await go("/events?month=2026-11")
        await pg.wait_for_selector('[data-testid=events-count]')
        first_card = await pg.get_by_test_id("event-card").first.inner_text()
        ok("approved featured event appears first in Nov", EV in first_card and "Featured" in first_card)
        await go("/")
        ok("featured event on home", EV in await pg.locator("main").inner_text())

        # desktop sanity
        dctx = await b.new_context(viewport={"width": 1280, "height": 900})
        dp = await dctx.new_page()
        dp.on("pageerror", lambda e: errors.append(f"PAGEERROR desktop {e}"))
        await dp.goto(BASE + "/", wait_until="networkidle"); await dp.screenshot(path=os.path.join(SHOTS, "18-home-desktop.png"))
        await dp.goto(BASE + "/retreats", wait_until="networkidle"); await dp.screenshot(path=os.path.join(SHOTS, "19-retreats-desktop.png"))
        await b.close()

    ok("no console errors / page errors", not errors, "; ".join(errors[:5]))
    ok("no sideways scrolling at 390px", not wide, "; ".join(wide))
    fails = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(fails)}/{len(results)} checks passed")
    sys.exit(1 if fails else 0)

asyncio.run(main())
