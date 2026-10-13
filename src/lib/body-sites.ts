/** Anatomical sites for FORM-14 histopathology specimen marking. */

export type BodyView = "front" | "back";
export type BodySex = "male" | "female" | "unspecified";

export type BodySiteId =
  | "scalp"
  | "face"
  | "neck"
  | "chest"
  | "breast_l"
  | "breast_r"
  | "abdomen"
  | "flank_l"
  | "flank_r"
  | "back_upper"
  | "back_lower"
  | "shoulder_l"
  | "shoulder_r"
  | "upper_arm_l"
  | "upper_arm_r"
  | "forearm_l"
  | "forearm_r"
  | "hand_l"
  | "hand_r"
  | "pelvis"
  | "buttock_l"
  | "buttock_r"
  | "thigh_l"
  | "thigh_r"
  | "knee_l"
  | "knee_r"
  | "lower_leg_l"
  | "lower_leg_r"
  | "foot_l"
  | "foot_r";

export type BodySiteMark = {
  id: BodySiteId;
  label: string;
  view: BodyView;
};

export type BodySiteDef = {
  id: BodySiteId;
  label: string;
  view: BodyView;
  /** Ellipse center/radius in SVG viewBox 0 0 200 480 */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export const BODY_SITES: BodySiteDef[] = [
  // Front
  { id: "scalp", label: "Scalp / head", view: "front", cx: 100, cy: 28, rx: 22, ry: 18 },
  { id: "face", label: "Face", view: "front", cx: 100, cy: 52, rx: 16, ry: 14 },
  { id: "neck", label: "Neck", view: "front", cx: 100, cy: 78, rx: 12, ry: 10 },
  { id: "chest", label: "Chest", view: "front", cx: 100, cy: 125, rx: 36, ry: 28 },
  { id: "breast_l", label: "Breast (left)", view: "front", cx: 78, cy: 120, rx: 14, ry: 12 },
  { id: "breast_r", label: "Breast (right)", view: "front", cx: 122, cy: 120, rx: 14, ry: 12 },
  { id: "abdomen", label: "Abdomen", view: "front", cx: 100, cy: 185, rx: 32, ry: 30 },
  { id: "flank_l", label: "Flank (left)", view: "front", cx: 62, cy: 175, rx: 10, ry: 22 },
  { id: "flank_r", label: "Flank (right)", view: "front", cx: 138, cy: 175, rx: 10, ry: 22 },
  { id: "shoulder_l", label: "Shoulder (left)", view: "front", cx: 52, cy: 105, rx: 14, ry: 12 },
  { id: "shoulder_r", label: "Shoulder (right)", view: "front", cx: 148, cy: 105, rx: 14, ry: 12 },
  { id: "upper_arm_l", label: "Upper arm (left)", view: "front", cx: 42, cy: 155, rx: 10, ry: 24 },
  { id: "upper_arm_r", label: "Upper arm (right)", view: "front", cx: 158, cy: 155, rx: 10, ry: 24 },
  { id: "forearm_l", label: "Forearm (left)", view: "front", cx: 34, cy: 215, rx: 9, ry: 22 },
  { id: "forearm_r", label: "Forearm (right)", view: "front", cx: 166, cy: 215, rx: 9, ry: 22 },
  { id: "hand_l", label: "Hand (left)", view: "front", cx: 28, cy: 255, rx: 10, ry: 12 },
  { id: "hand_r", label: "Hand (right)", view: "front", cx: 172, cy: 255, rx: 10, ry: 12 },
  { id: "pelvis", label: "Pelvis / groin", view: "front", cx: 100, cy: 245, rx: 28, ry: 18 },
  { id: "thigh_l", label: "Thigh (left)", view: "front", cx: 78, cy: 310, rx: 16, ry: 36 },
  { id: "thigh_r", label: "Thigh (right)", view: "front", cx: 122, cy: 310, rx: 16, ry: 36 },
  { id: "knee_l", label: "Knee (left)", view: "front", cx: 78, cy: 365, rx: 12, ry: 10 },
  { id: "knee_r", label: "Knee (right)", view: "front", cx: 122, cy: 365, rx: 12, ry: 10 },
  { id: "lower_leg_l", label: "Lower leg (left)", view: "front", cx: 78, cy: 415, rx: 12, ry: 28 },
  { id: "lower_leg_r", label: "Lower leg (right)", view: "front", cx: 122, cy: 415, rx: 12, ry: 28 },
  { id: "foot_l", label: "Foot (left)", view: "front", cx: 76, cy: 460, rx: 14, ry: 8 },
  { id: "foot_r", label: "Foot (right)", view: "front", cx: 124, cy: 460, rx: 14, ry: 8 },
  // Back
  { id: "scalp", label: "Scalp / head", view: "back", cx: 100, cy: 28, rx: 22, ry: 18 },
  { id: "neck", label: "Neck", view: "back", cx: 100, cy: 78, rx: 12, ry: 10 },
  { id: "back_upper", label: "Upper back", view: "back", cx: 100, cy: 135, rx: 36, ry: 32 },
  { id: "back_lower", label: "Lower back / lumbar", view: "back", cx: 100, cy: 195, rx: 32, ry: 26 },
  { id: "shoulder_l", label: "Shoulder (left)", view: "back", cx: 52, cy: 105, rx: 14, ry: 12 },
  { id: "shoulder_r", label: "Shoulder (right)", view: "back", cx: 148, cy: 105, rx: 14, ry: 12 },
  { id: "upper_arm_l", label: "Upper arm (left)", view: "back", cx: 42, cy: 155, rx: 10, ry: 24 },
  { id: "upper_arm_r", label: "Upper arm (right)", view: "back", cx: 158, cy: 155, rx: 10, ry: 24 },
  { id: "forearm_l", label: "Forearm (left)", view: "back", cx: 34, cy: 215, rx: 9, ry: 22 },
  { id: "forearm_r", label: "Forearm (right)", view: "back", cx: 166, cy: 215, rx: 9, ry: 22 },
  { id: "hand_l", label: "Hand (left)", view: "back", cx: 28, cy: 255, rx: 10, ry: 12 },
  { id: "hand_r", label: "Hand (right)", view: "back", cx: 172, cy: 255, rx: 10, ry: 12 },
  { id: "buttock_l", label: "Buttock (left)", view: "back", cx: 80, cy: 250, rx: 18, ry: 16 },
  { id: "buttock_r", label: "Buttock (right)", view: "back", cx: 120, cy: 250, rx: 18, ry: 16 },
  { id: "thigh_l", label: "Thigh (left)", view: "back", cx: 78, cy: 310, rx: 16, ry: 36 },
  { id: "thigh_r", label: "Thigh (right)", view: "back", cx: 122, cy: 310, rx: 16, ry: 36 },
  { id: "knee_l", label: "Knee (left)", view: "back", cx: 78, cy: 365, rx: 12, ry: 10 },
  { id: "knee_r", label: "Knee (right)", view: "back", cx: 122, cy: 365, rx: 12, ry: 10 },
  { id: "lower_leg_l", label: "Lower leg (left)", view: "back", cx: 78, cy: 415, rx: 12, ry: 28 },
  { id: "lower_leg_r", label: "Lower leg (right)", view: "back", cx: 122, cy: 415, rx: 12, ry: 28 },
  { id: "foot_l", label: "Foot (left)", view: "back", cx: 76, cy: 460, rx: 14, ry: 8 },
  { id: "foot_r", label: "Foot (right)", view: "back", cx: 124, cy: 460, rx: 14, ry: 8 },
];

/** Unique site id+view key for selection state. */
export function siteKey(site: Pick<BodySiteMark, "id" | "view">) {
  return `${site.view}:${site.id}`;
}

export function parseBodySites(raw: string | null | undefined): BodySiteMark[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is BodySiteMark =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as BodySiteMark).id === "string" &&
          typeof (item as BodySiteMark).label === "string" &&
          ((item as BodySiteMark).view === "front" || (item as BodySiteMark).view === "back"),
      )
      .map((item) => ({
        id: item.id as BodySiteId,
        label: item.label,
        view: item.view,
      }));
  } catch {
    return [];
  }
}

export function serializeBodySites(sites: BodySiteMark[]): string | null {
  if (!sites.length) return null;
  return JSON.stringify(sites);
}

export function bodySitesSummary(sites: BodySiteMark[]): string {
  if (!sites.length) return "";
  return sites
    .map((s) => `${s.label} (${s.view})`)
    .join("; ");
}

export function sitesForView(view: BodyView): BodySiteDef[] {
  return BODY_SITES.filter((s) => s.view === view);
}
