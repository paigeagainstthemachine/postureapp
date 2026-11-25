from reportlab.lib import colors
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from make_pdfs import make_doc, grid, P, H1, SUB, H2, SMALL, CELL, CELLB, HEAD, TEAL, LINK, ParagraphStyle

LNK = ParagraphStyle("LNK", parent=CELL, fontSize=8.6, leading=11.5)


def link(label, url):
    return '<link href="%s" color="#1B5FA8"><u>%s</u></link>' % (url, label)


def build():
    doc = make_doc("/home/claude/out/Shopping_List_Posture_Plan.pdf", "Posture plan: shopping list")
    s = [Paragraph("Shopping List", H1),
         Paragraph("Everything for Phases 1 and 2, built around the weight cage you already have. Prices are what the listings showed when I looked "
                   "today, so check before buying. I linked a few options per item so you can pick by price or availability.", SUB)]

    hdr = [P("Item", HEAD), P("Why you need it", HEAD), P("Options and links", HEAD), P("Approx.", HEAD)]
    rows = [hdr]

    def row(item, why, links, price):
        rows.append([P(item, CELLB), P(why), Paragraph("<br/>".join(links), LNK), P(price)])

    row("Resistance band set with handles",
        "Rows, face pulls, pull-aparts. Handles clip onto your cage, so the door anchor is a spare. Get a set with several resistance levels.",
        [link("Walmart: 11-piece set, up to 150 lb, handles and door anchor", "https://walmart.com/ip/358251807"),
         link("Target: door-anchor band sets (Swtroom, HolaHatha and others)", "https://www.target.com/s/door+anchor+bands"),
         link("Walmart: TheFitLife 5-band set with handles", "https://www.walmart.com/ip/PRCTZ-Resistance-Exercise-Tube-Bands-Set-Includes-Resistance-Tubes-bands-Handles-Ankle-Straps-Door-Anchor-Multi-Color-Set/910579965")],
        "$20 to $30")

    row("Light dumbbells, 2 to 10 lb",
        "Side-lying rotation (2 to 5 lb), Y raises (1 to 3 lb), and rows (3 to 10 lb). A light set beats one adjustable pair for this plan.",
        [link("Best Buy: BalanceFrom 2, 3, 5, 8, 10 lb set with rack", "https://www.bestbuy.com/product/balancefrom-fitness-2-3-5-8-10-pound-neoprene-coated-dumbbell-set-with-rack-multi-color/J3GW3ZKPP9/sku/11630426"),
         link("Target: HolaHatha 2, 3, 5, 8, 10 lb set with rack", "https://target.com/p/holahatha-2-3-5-8-and-10-pound-neoprene-dumbbell-free-hand-weight-set-with-storage-rack-ideal-for-home-exercises-to-gain-tone-and-definition/-/A-84300982"),
         link("Target: hex dumbbell pairs, 5 to 15 lb (sold by the pair)", "https://www.target.com/p/5lb-8lb-10lb-12lb-15lb-coated-rubber-hex-dumbbell-pair-of-2/-/A-1007106961")],
        "$60 to $120")

    row("Adjustable incline bench",
        "Chest-supported rows and Y raises in Phase 2. Needs an incline of about 30 to 45 degrees. Skip it if your cage setup already has an adjustable bench.",
        [link("Dick's: Fitness Gear weight bench (about $130, confirm it inclines)", "https://www.dickssportinggoods.com/a/adjustable-decline-bench-0axz01b.html"),
         link("Dick's: adjustable incline benches incl. Sunny Health (about $215)", "https://www.dickssportinggoods.com/a/adjustable-incline-bench.html"),
         link("Titan Fitness: adjustable benches", "https://titan.fitness/collections/adjustable-benches"),
         link("REP Fitness: adjustable benches", "https://repfitness.com/collections/adjustable-weight-benches")],
        "$130 to $215")

    row("Lacrosse ball",
        "Light self-massage on the wall for the right shoulder and between the blade and spine.",
        [link("Academy: Trigger Point lacrosse massage balls, 2-pack", "https://www.academy.com/p/trigger-point-lacrosse-massage-balls-2-pack?sku=grey"),
         link("Walmart: ProsourceFit lacrosse massage ball", "https://www.walmart.com/ip/50997669")],
        "$5 to $10")

    row("Thick exercise mat (10 mm)",
        "Comfort for side-lying work, bird dogs, and chin nods on the floor.",
        [link("Dick's: Gaiam 10 mm fitness mat", "https://www.dickssportinggoods.com/p/gaiam-10mm-fitness-mat-22gima10mmgmftnsseac/22gima10mmgmftnsseac"),
         link("Walmart: Gaiam Essentials thick mat, 72 x 24 in", "https://www.walmart.com/ip/463365068")],
        "$20 to $30")

    row("Foam roller, 36 in (optional)",
        "Gentle thoracic extension postpartum, once you are cleared to lie on your back. Not needed during Phase 1.",
        [link("Walmart: ProsourceFit high-density foam roller", "https://www.walmart.com/ip/3673956461"),
         link("Walmart: OPTP PRO-ROLLER standard density", "https://www.walmart.com/ip/121112752")],
        "$12 to $25")

    row("Mini loop bands (optional)",
        "Light shoulder and hip activation warm-ups. Fabric ones do not roll or slide.",
        [link("Walmart: SPRI mini loop bands, 3-pack", "https://www.walmart.com/ip/SPRI-Mini-Loop-Bands-Kit-3-Pack/859190098"),
         link("Serious Steel fabric mini loop bands, 5-pack", "https://www.living.fit/collections/serious-steel-fitness/products/fabric-mini-loop-resistance-band-set")],
        "$9 to $23")

    s.append(grid(rows, [96, 150, 220, 46]))
    s.append(Spacer(1, 10))

    tot = [[P("Core items only (bands, dumbbells, bench, ball, mat)", CELLB), P("about $235 to $405", CELLB)],
           [P("With the optional roller and mini bands", CELLB), P("about $260 to $450", CELLB)]]
    t = Table(tot, colWidths=[360, 152])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#B7C6C4")),
                           ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E8F1F0")),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    s.append(t)
    s.append(Spacer(1, 6))
    s.append(Paragraph("Both totals come in under your $500 budget. Skipping the bench (if your cage has one) saves $130 or more. "
                       "A TRX-style suspension trainer would also work for rows later, but it runs $130 and up and the bands cover the same ground, so I left it out.", SMALL))
    s.append(Spacer(1, 6))
    s.append(Paragraph("Buying tip: for Phase 1 you only need the bands, light dumbbells (or even a water bottle for side-lying rotation), the lacrosse ball, and a mat. "
                       "The bench can wait until Phase 2.", SMALL))
    doc.build(s)


if __name__ == "__main__":
    build()
