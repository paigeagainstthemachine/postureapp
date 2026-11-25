from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, PageBreak, KeepTogether)
from figs import Fig, TEAL, ORANGE

DARK = colors.HexColor("#222222")
LIGHT = colors.HexColor("#E8F1F0")
GRID = colors.HexColor("#B7C6C4")
LINK = colors.HexColor("#1B5FA8")

H1 = ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=TEAL, spaceAfter=4)
SUB = ParagraphStyle("SUB", fontName="Helvetica", fontSize=11, leading=15, textColor=colors.HexColor("#555555"), spaceAfter=10)
H2 = ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=TEAL, spaceBefore=10, spaceAfter=5)
BODY = ParagraphStyle("BODY", fontName="Helvetica", fontSize=10, leading=14, textColor=DARK)
SMALL = ParagraphStyle("SMALL", fontName="Helvetica", fontSize=8.8, leading=12, textColor=DARK)
CELL = ParagraphStyle("CELL", fontName="Helvetica", fontSize=9, leading=12, textColor=DARK)
CELLB = ParagraphStyle("CELLB", parent=CELL, fontName="Helvetica-Bold")
HEAD = ParagraphStyle("HEAD", parent=CELL, fontName="Helvetica-Bold", textColor=colors.white, alignment=1)
ENAME = ParagraphStyle("ENAME", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=DARK, spaceAfter=1)
EDOSE = ParagraphStyle("EDOSE", fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=TEAL, spaceAfter=3)
EBODY = ParagraphStyle("EBODY", fontName="Helvetica", fontSize=9, leading=12.2, textColor=DARK)


def make_doc(path, title):
    doc = BaseDocTemplate(path, pagesize=letter, leftMargin=0.7 * inch, rightMargin=0.7 * inch,
                          topMargin=0.65 * inch, bottomMargin=0.7 * inch, title=title)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")

    def footer(c, d):
        c.saveState()
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor("#777777"))
        c.drawString(doc.leftMargin, 0.42 * inch, title)
        c.drawRightString(letter[0] - doc.rightMargin, 0.42 * inch, "Page %d" % d.page)
        c.restoreState()

    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=footer)])
    return doc


def card(key, name, dose, how, note=None):
    txt = [Paragraph(name, ENAME), Paragraph(dose, EDOSE), Paragraph(how, EBODY)]
    if note:
        txt.append(Spacer(1, 3))
        txt.append(Paragraph("<font color='#D9772B'><b>Note:</b></font> " + note, EBODY))
    t = Table([[Fig(key), txt]], colWidths=[140, 372])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, GRID),
    ]))
    return t


def grid(rows, colw, header_rows=1, extra=None):
    t = Table(rows, colWidths=colw, repeatRows=header_rows)
    st = [
        ("BACKGROUND", (0, 0), (-1, header_rows - 1), TEAL),
        ("GRID", (0, 0), (-1, -1), 0.6, GRID),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, header_rows), (-1, -1), [colors.white, LIGHT]),
    ]
    if extra:
        st += extra
    t.setStyle(TableStyle(st))
    return t


def P(t, s=CELL):
    return Paragraph(t, s)


DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


# ------------------------------------------------------------------ PHASE 1
def phase1():
    doc = make_doc("/home/claude/out/Phase1_Weekly_Schedule_Now_to_Delivery.pdf", "Posture plan, Phase 1: now until delivery")
    s = []
    s.append(Paragraph("Phase 1: Now Until Delivery", H1))
    s.append(Paragraph("About 10 minutes a day. Gentle, low effort, pregnancy-safe positions. The goal is to calm the neck and shoulder "
                       "muscles that are overworking and wake up the ones that should be doing the holding.", SUB))

    s.append(Paragraph("Ground rules", H2))
    rules = [
        "Stay upright, seated, standing, or on your left side. No lying flat on your back, nothing face-down.",
        "Light effort only (about 5 out of 10). Stop each set with plenty left in the tank.",
        "Breathe out on the effort. No breath holding.",
        "Skip deep stretching. Your joints are already looser from pregnancy plus hypermobility.",
        "Stop and rest if you feel dizzy, short of breath, sharp pain, or tingling or numbness in the arm.",
    ]
    for r in rules:
        s.append(Paragraph("&bull;&nbsp; " + r, BODY))
    s.append(Spacer(1, 4))

    s.append(Paragraph("Weekly checklist", H2))
    s.append(Paragraph("Do the block once a day. Tick the box when done. Chin nods get squeezed in 2 or 3 extra times a day while you work or feed.", SMALL))
    s.append(Spacer(1, 5))
    hdr = [P("Exercise", HEAD), P("Dose", HEAD)] + [P(d, HEAD) for d in DAYS]
    rows = [hdr]
    items = [
        ("Chin nods (seated)", "10 x 5 sec, 3x/day"),
        ("Band row", "2 x 12"),
        ("Band pull-apart", "2 x 12 to 15"),
        ("Wall slide + serratus push", "2 x 10"),
        ("Side-lying rotation, right arm", "2 x 10"),
        ("Seated thoracic extension", "5 slow reps"),
        ("Lacrosse ball on wall", "1 to 2 min per spot"),
    ]
    for n, d in items:
        rows.append([P(n, CELLB), P(d)] + [""] * 7)
    t = grid(rows, [150, 108] + [36.5] * 7, extra=[("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.white]),
                                                    ("TOPPADDING", (0, 1), (-1, -1), 9), ("BOTTOMPADDING", (0, 1), (-1, -1), 9)])
    s.append(t)
    s.append(Spacer(1, 8))
    s.append(Paragraph("Lacrosse ball: aim for every other day. Use light pressure, 4 out of 10, never on the spine or the front of the neck.", SMALL))

    s.append(Paragraph("Newborn posture, the part that matters most", H2))
    for r in [
        "Bring the baby up to you with pillows so your forearms are supported and your head is not tipped down.",
        "Switch sides often. Drop your shoulders away from your ears and do 3 chin nods every time you switch.",
        "Carry the car seat close to your body and swap arms, or leave it on a base or stroller when you can.",
    ]:
        s.append(Paragraph("&bull;&nbsp; " + r, BODY))
    s.append(Spacer(1, 6))
    s.append(Paragraph("Worth a call the same day: a headache that is severe or new, will not ease with rest and fluids, or comes with vision changes, "
                       "upper right belly pain, or sudden swelling.", SMALL))
    s.append(PageBreak())

    s.append(Paragraph("The exercises", H1))
    s.append(Paragraph("Orange equipment shows bands and weights. Dashed grey lines show the starting position.", SUB))
    s.append(card("chin_nod", "1. Chin nods", "10 reps, hold 5 sec. 3 times a day.",
                  "Sit tall. Glide your chin straight back as if making a double chin, keeping your eyes level. Do not tip your head down. "
                  "You should feel the front of your neck working, not the back tightening.",
                  "Do these any time you notice your head creeping forward."))
    s.append(card("band_row", "2. Seated band row", "2 sets of 12. Light band.",
                  "Anchor the band at chest height in front of you (the cage works, or a door anchor). Pull elbows back and slightly down, "
                  "squeeze shoulder blades, then let the band pull your hands forward slowly. Keep shoulders away from your ears.",
                  "Back-and-down, not back-and-up. If your traps take over, use a lighter band."))
    s.append(card("pull_apart", "3. Band pull-apart", "2 sets of 12 to 15. Very light band.",
                  "Hold a light band in front of you at chest height, arms straight but not locked. Pull the band apart by rotating your arms outward "
                  "and squeezing your shoulder blades gently.",
                  "Stop before your arms go behind your body. Hypermobile shoulders do not need extra range."))
    s.append(card("wall_slide", "4. Wall slide with serratus push", "2 sets of 10.",
                  "Stand facing a wall, forearms on it. Push the wall away so your shoulder blades wrap around your ribs, then slide your forearms up "
                  "as far as you can without your shoulders hiking up. Slide back down slowly.",
                  "Only go as high as you can keep your shoulders low."))
    s.append(card("side_lying_er", "5. Side-lying external rotation (right arm)", "2 sets of 10. 1 to 2 lb.",
                  "Lie on your LEFT side with a pillow under your head and between your knees. Right elbow rests on a small rolled towel at your ribs, "
                  "forearm across your belly. Rotate the forearm up toward the ceiling slowly, then lower for a count of 3.",
                  "Left side-lying is the comfortable and recommended side for late pregnancy. Do the left arm too if you like, but the right one is the priority."))
    s.append(card("thoracic_ext", "6. Seated thoracic extension", "5 slow reps.",
                  "Sit in a chair with a firm back at about shoulder-blade height. Hands behind your head. Gently lean back over the chair so the "
                  "bend happens in your upper back, keeping your ribs down. Come back up slowly.",
                  "A small, gentle bend is enough. Skip it if it pinches."))
    s.append(card("lacrosse_wall", "7. Lacrosse ball on the wall", "1 to 2 min per spot, light pressure.",
                  "Stand with the ball between you and the wall. Find the spots you described: the top of the right shoulder near the neck, and "
                  "between the shoulder blade and spine. Lean in lightly, then make tiny slow movements. Breathe out as the spot softens.",
                  "Avoid the spine itself and the front or sides of the neck."))
    doc.build(s)


# ------------------------------------------------------------------ PHASE 2
def phase2():
    doc = make_doc("/home/claude/out/Phase2_Weekly_Schedule_After_Clearance.pdf", "Posture plan, Phase 2: after clearance")
    s = []
    s.append(Paragraph("Phase 2: After You Are Cleared", H1))
    s.append(Paragraph("Strength building for the postural muscles. Start once your provider says exercise is fine (commonly around 6 weeks postpartum, "
                       "sometimes later). Ease in by doing Phase 1 for the first week or two.", SUB))

    s.append(Paragraph("Your week", H2))
    hdr = [P("Day", HEAD), P("What", HEAD), P("Time", HEAD)]
    rows = [hdr,
            [P("Mon", CELLB), P("<b>Strength day</b> (all exercises below)"), P("30 to 35 min")],
            [P("Tue", CELLB), P("Easy walk + chin nods + lacrosse ball"), P("15 to 20 min")],
            [P("Wed", CELLB), P("<b>Strength day</b>"), P("30 to 35 min")],
            [P("Thu", CELLB), P("Easy walk + chin nods"), P("15 to 20 min")],
            [P("Fri", CELLB), P("<b>Strength day</b>"), P("30 to 35 min")],
            [P("Sat", CELLB), P("Optional walk or gentle movement"), P("as you like")],
            [P("Sun", CELLB), P("Rest. Chin nods only."), P("2 min")]]
    s.append(grid(rows, [60, 340, 112]))

    s.append(Paragraph("Strength day checklist", H2))
    s.append(Paragraph("Start with 5 minutes of walking or easy arm circles. Finish with the lacrosse ball. Tick off each exercise (one box per week).", SMALL))
    s.append(Spacer(1, 5))
    hdr = [P("Exercise", HEAD), P("Sets x reps", HEAD)] + [P("Wk %d" % i, HEAD) for i in range(1, 9)]
    rows = [hdr]
    ex = [
        ("Chin nods", "10 x 5 sec"),
        ("Incline chest-supported row", "3 x 10 to 12"),
        ("Band face pull", "3 x 15"),
        ("Band pull-apart", "3 x 15"),
        ("Side-lying rotation", "3 x 12"),
        ("Serratus wall push-up plus", "3 x 10"),
        ("Incline Y raise", "2 x 10"),
        ("Bird dog", "2 x 8 per side"),
    ]
    for n, d in ex:
        rows.append([P(n, CELLB), P(d)] + [""] * 8)
    s.append(grid(rows, [140, 92] + [35] * 8, extra=[("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.white]),
                                                      ("TOPPADDING", (0, 1), (-1, -1), 8), ("BOTTOMPADDING", (0, 1), (-1, -1), 8)]))
    s.append(Spacer(1, 4))
    s.append(Paragraph("Week boxes: tick when you finish all 3 strength days that week. Chin nods are daily.", SMALL))

    s.append(PageBreak())
    s.append(Paragraph("How to progress", H2))
    rows = [[P("Weeks", HEAD), P("What changes", HEAD)],
            [P("1 to 2", CELLB), P("2 sets of everything, lightest band and 1 to 3 lb. Stop 3 to 4 reps before it gets hard.")],
            [P("3 to 4", CELLB), P("3 sets as listed. Same weights. Last 2 reps should feel like work.")],
            [P("5 to 6", CELLB), P("Move up one band color or add 1 to 2 lb on rows and face pulls. Keep form first.")],
            [P("7 to 8", CELLB), P("Same load, slower tempo: 3 seconds lowering on every rep.")],
            [P("9 to 12", CELLB), P("One more step up in load every 2 weeks, only if shoulders and neck feel good.")]]
    s.append(grid(rows, [60, 452]))
    s.append(Spacer(1, 6))
    s.append(Paragraph("If neck or shoulder pain flares for more than a day, drop back one step for a week. Feeding and carrying a newborn add load on top of this, "
                       "so some days will simply be lower-energy days. Do the chin nods and move on.", SMALL))
    s.append(Spacer(1, 14))

    s.append(Paragraph("The exercises", H1))
    s.append(Paragraph("Orange equipment shows bands and weights. Dashed grey lines show the starting position.", SUB))
    s.append(card("incline_row", "1. Incline chest-supported row", "3 x 10 to 12. Start 3 to 5 lb each hand.",
                  "Set the bench to about 30 to 45 degrees. Lie face-down with your chest on the pad and your head just above the top. "
                  "Let the dumbbells hang, then row your elbows up and back, squeeze the shoulder blades, and lower for 3 seconds.",
                  "The pad takes your lower back out of it so the work lands in the mid back."))
    s.append(card("face_pull", "2. Band face pull", "3 x 15. Light to medium band.",
                  "Anchor the band at about face height. Pull the band toward your forehead, hands apart, elbows high, rotating your forearms "
                  "up and out at the end. Pause for a second, then return slowly.",
                  "This is the best single exercise for rounded shoulders. Do not lean back to cheat."))
    s.append(card("pull_apart", "3. Band pull-apart", "3 x 15. Light band.",
                  "Hold the band at chest height, arms straight but soft at the elbow. Pull apart by rotating your arms outward and squeezing your "
                  "shoulder blades, stopping when your hands are in line with your shoulders.",
                  "Do not go past the line of your shoulders."))
    s.append(card("side_lying_er", "4. Side-lying external rotation", "3 x 12. 2 to 5 lb.",
                  "Lie on your side with a small towel under the elbow. Rotate the forearm up slowly and lower it for a count of 3. "
                  "Do the right side first and add a rep or two there if it fatigues earlier.",
                  "Strengthens the rotator cuff, which is what holds a loose shoulder in its socket."))
    s.append(card("plus_pushup", "5. Serratus wall push-up plus", "3 x 10.",
                  "Hands on a wall at shoulder height, body in a straight line. Do a small push-up, then at the top push the wall away "
                  "a little further so your shoulder blades spread around your ribs. Hold 1 second.",
                  "Progress to a hands-on-bench version after a few weeks."))
    s.append(card("y_raise", "6. Incline Y raise", "2 x 10. 1 to 3 lb.",
                  "Same incline bench, chest on the pad. Lift your arms out and up in a Y shape with thumbs up, leading with the lower traps "
                  "(think of pulling your shoulder blades toward your back pockets). Lower slowly.",
                  "Start with no weight if your neck takes over."))
    s.append(card("bird_dog", "7. Bird dog", "2 x 8 per side.",
                  "On hands and knees with a flat back. Reach one arm forward and the opposite leg back, hold 2 seconds, then switch. "
                  "Keep your hips level and do not let your lower back arch.",
                  "Good postpartum core and shoulder-stability combo."))
    s.append(card("lacrosse_wall", "8. Lacrosse ball finish", "1 to 2 min per spot.",
                  "Same as Phase 1. Use the ball on the wall for the right shoulder and the spot between shoulder blade and spine to finish a session. "
                  "Light pressure, breathe out as the spot softens.",
                  "Never on the spine or the front of the neck."))
    doc.build(s)


if __name__ == "__main__":
    phase1()
    phase2()
