"""Simple stick-figure illustrations for the exercise cards (drawn with reportlab)."""
import math
from reportlab.lib import colors
from reportlab.platypus import Flowable

DARK = colors.HexColor("#2B2B2B")
TEAL = colors.HexColor("#2F6F6B")
ORANGE = colors.HexColor("#D9772B")
GHOST = colors.HexColor("#A9B4B3")
BG = colors.HexColor("#EEF4F3")
FLOOR = colors.HexColor("#8A9695")


def L(c, pts, w=2.2, col=DARK, dash=None):
    c.setStrokeColor(col)
    c.setLineWidth(w)
    c.setDash(dash or [])
    c.setLineCap(1)
    c.setLineJoin(1)
    p = c.beginPath()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    c.drawPath(p, stroke=1, fill=0)
    c.setDash([])


def H(c, x, y, r=6.5, col=DARK, dash=None, w=2.2):
    c.setStrokeColor(col)
    c.setLineWidth(w)
    c.setDash(dash or [])
    c.circle(x, y, r, stroke=1, fill=0)
    c.setDash([])


def A(c, x1, y1, x2, y2, col=TEAL, w=2):
    L(c, [(x1, y1), (x2, y2)], w=w, col=col)
    ang = math.atan2(y2 - y1, x2 - x1)
    s = 5.5
    for d in (2.6, -2.6):
        L(c, [(x2, y2), (x2 - s * math.cos(ang + d * 0.18 + (0 if d > 0 else 0)),
                          y2 - s * math.sin(ang + d * 0.18))], w=w, col=col)


def arrow(c, x1, y1, x2, y2, col=TEAL, w=2):
    """Line with a proper two-stroke arrowhead."""
    L(c, [(x1, y1), (x2, y2)], w=w, col=col)
    ang = math.atan2(y2 - y1, x2 - x1)
    s = 6
    for off in (0.5, -0.5):
        L(c, [(x2, y2), (x2 - s * math.cos(ang + off), y2 - s * math.sin(ang + off))], w=w, col=col)


def dumbbell(c, x, y, horizontal=True):
    c.setFillColor(ORANGE)
    c.setStrokeColor(ORANGE)
    if horizontal:
        c.rect(x - 7, y - 2, 14, 4, fill=1, stroke=0)
        c.rect(x - 8, y - 5, 4, 10, fill=1, stroke=0)
        c.rect(x + 4, y - 5, 4, 10, fill=1, stroke=0)
    else:
        c.rect(x - 2, y - 7, 4, 14, fill=1, stroke=0)
        c.rect(x - 5, y - 8, 10, 4, fill=1, stroke=0)
        c.rect(x - 5, y + 4, 10, 4, fill=1, stroke=0)


def floor(c, y=2, x0=4, x1=126):
    L(c, [(x0, y), (x1, y)], w=1.4, col=FLOOR)


def wall(c, x, y0=0, y1=98):
    L(c, [(x, y0), (x, y1)], w=3, col=FLOOR)


def band(c, pts):
    L(c, pts, w=1.6, col=ORANGE)


def anchor(c, x, y):
    c.setFillColor(FLOOR)
    c.circle(x, y, 3.2, fill=1, stroke=0)


# ---- individual drawings (canvas box is 130 x 100) -----------------------

def chin_nod(c):
    floor(c, 8)
    # chair
    L(c, [(30, 30), (72, 30)], w=2, col=FLOOR)
    L(c, [(30, 30), (30, 66)], w=2, col=FLOOR)
    L(c, [(34, 30), (34, 8)], w=2, col=FLOOR)
    L(c, [(68, 30), (68, 8)], w=2, col=FLOOR)
    # body
    L(c, [(48, 34), (48, 66)])                       # torso
    L(c, [(48, 34), (76, 34), (76, 10)])             # leg
    L(c, [(48, 62), (52, 46), (66, 42)])             # arm
    H(c, 56, 82, dash=[2, 2], col=GHOST)             # ghost head (forward)
    L(c, [(48, 66), (49, 72)])
    H(c, 49, 80)                                      # head tucked back
    arrow(c, 66, 94, 54, 94)


def band_row(c):
    floor(c, 8)
    L(c, [(30, 30), (72, 30)], w=2, col=FLOOR)
    L(c, [(34, 30), (34, 8)], w=2, col=FLOOR)
    L(c, [(68, 30), (68, 8)], w=2, col=FLOOR)
    L(c, [(46, 34), (46, 66)])
    L(c, [(46, 34), (74, 34), (74, 10)])
    L(c, [(46, 66), (47, 72)])
    H(c, 47, 80)
    L(c, [(46, 62), (34, 52), (58, 54)])             # elbow back, hands forward
    band(c, [(58, 54), (120, 54)])
    anchor(c, 120, 54)
    L(c, [(58, 54), (84, 54)], w=0.1, col=BG)
    arrow(c, 40, 42, 28, 42)


def pull_apart(c):
    floor(c, 4)
    H(c, 65, 82)
    L(c, [(65, 75), (65, 36)])
    L(c, [(65, 36), (56, 4)])
    L(c, [(65, 36), (74, 4)])
    L(c, [(65, 66), (30, 66)])
    L(c, [(65, 66), (100, 66)])
    band(c, [(30, 66), (100, 66)])
    arrow(c, 28, 76, 12, 76)
    arrow(c, 102, 76, 118, 76)


def wall_slide(c):
    wall(c, 24)
    floor(c, 2, x0=24)
    H(c, 56, 82)
    L(c, [(56, 75), (60, 38)])
    L(c, [(60, 38), (60, 20), (62, 2)])
    # forearms along wall
    L(c, [(58, 66), (38, 62), (28, 82)])
    L(c, [(58, 66), (38, 62), (28, 58)], col=GHOST, dash=[2, 2])
    arrow(c, 16, 52, 16, 88)
    # serratus cue: arrows pushing wall
    arrow(c, 44, 70, 34, 70, col=ORANGE, w=1.6)


def side_lying_er(c):
    floor(c, 30)
    H(c, 18, 44)
    L(c, [(25, 42), (78, 40)])                       # torso lying
    L(c, [(78, 40), (100, 46), (92, 36)])            # bent legs
    # top arm: elbow tucked at ribs
    L(c, [(36, 44), (46, 54)])                       # upper arm
    L(c, [(46, 54), (66, 56)], col=GHOST, dash=[2, 2])  # start, across belly
    L(c, [(46, 54), (44, 78)])                       # end, forearm up
    dumbbell(c, 44, 80, horizontal=True)
    arrow(c, 62, 72, 52, 80, w=1.8)
    # towel roll under elbow
    c.setFillColor(GHOST)
    c.circle(48, 50, 2.5, fill=1, stroke=0)


def thoracic_ext(c):
    floor(c, 8)
    L(c, [(60, 30), (96, 30)], w=2, col=FLOOR)
    L(c, [(64, 30), (64, 8)], w=2, col=FLOOR)
    L(c, [(92, 30), (92, 8)], w=2, col=FLOOR)
    L(c, [(60, 30), (60, 62)], w=3, col=FLOOR)       # chair back
    L(c, [(72, 34), (60, 46), (52, 62), (44, 76)])   # arched spine
    L(c, [(72, 34), (96, 34), (96, 10)])             # leg
    H(c, 37, 82, r=6)
    L(c, [(46, 70), (40, 88), (34, 80)])              # hands behind head
    arrow(c, 34, 56, 22, 66)


def lacrosse_wall(c):
    wall(c, 26)
    floor(c, 2, x0=26)
    L(c, [(34, 76), (38, 38)])
    L(c, [(38, 38), (50, 20), (46, 2)])
    H(c, 34, 86, r=6)
    L(c, [(34, 70), (46, 54), (52, 62)])
    c.setFillColor(ORANGE)
    c.circle(30, 60, 5, fill=1, stroke=0)
    arrow(c, 18, 52, 18, 72, w=1.8)
    arrow(c, 18, 72, 18, 52, w=1.8)


def _bench(c):
    floor(c, 2)
    L(c, [(30, 12), (84, 60)], w=5, col=FLOOR)       # pad
    L(c, [(30, 12), (30, 2)], w=2, col=FLOOR)
    L(c, [(84, 60), (92, 2)], w=2, col=FLOOR)
    # body lying chest down on pad, head just above the top end
    L(c, [(74, 70), (34, 34)])                       # torso
    L(c, [(34, 34), (26, 18), (32, 2)])              # legs hang to floor
    H(c, 85, 78)


def incline_row(c):
    _bench(c)
    L(c, [(72, 68), (80, 40)], col=GHOST, dash=[2, 2])
    dumbbell(c, 80, 38, horizontal=True)
    L(c, [(72, 68), (82, 60), (84, 46)])
    arrow(c, 104, 42, 104, 62, w=1.8)

def face_pull(c):
    floor(c, 2)
    anchor(c, 12, 78)
    H(c, 78, 84)
    L(c, [(78, 77), (80, 40)])
    L(c, [(80, 40), (82, 20), (82, 2)])
    L(c, [(78, 68), (64, 70), (54, 80)])
    band(c, [(54, 80), (12, 78)])
    arrow(c, 34, 62, 50, 62, w=1.8)
    arrow(c, 50, 62, 34, 62, w=1.2, col=GHOST)


def y_raise(c):
    _bench(c)
    L(c, [(72, 68), (80, 40)], col=GHOST, dash=[2, 2])
    L(c, [(76, 70), (108, 94)])
    dumbbell(c, 110, 95, horizontal=True)
    arrow(c, 96, 58, 108, 76, w=1.8)

def bird_dog(c):
    floor(c, 4)
    H(c, 22, 42)
    L(c, [(30, 44), (84, 44)])                        # back
    L(c, [(36, 44), (36, 6)])                         # support arm
    L(c, [(84, 44), (84, 16), (104, 8)])              # support leg (knee down)
    L(c, [(36, 46), (6, 62)], col=TEAL)               # reaching arm
    L(c, [(84, 44), (124, 50)], col=TEAL)             # reaching leg

def plus_pushup(c):
    wall(c, 108)
    floor(c, 2, x1=108)
    L(c, [(34, 4), (84, 66)])                        # body line
    H(c, 92, 78)
    L(c, [(84, 66), (106, 62)])                      # arm to wall
    arrow(c, 70, 74, 62, 84, w=1.6, col=ORANGE)
    arrow(c, 96, 52, 82, 52, w=1.8)


DRAWINGS = {
    "chin_nod": chin_nod,
    "band_row": band_row,
    "pull_apart": pull_apart,
    "wall_slide": wall_slide,
    "side_lying_er": side_lying_er,
    "thoracic_ext": thoracic_ext,
    "lacrosse_wall": lacrosse_wall,
    "incline_row": incline_row,
    "face_pull": face_pull,
    "y_raise": y_raise,
    "bird_dog": bird_dog,
    "plus_pushup": plus_pushup,
}


class Fig(Flowable):
    def __init__(self, key, w=130, h=100):
        super().__init__()
        self.key, self.width, self.height = key, w, h

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(BG)
        c.roundRect(0, 0, self.width, self.height, 6, fill=1, stroke=0)
        DRAWINGS[self.key](c)
