/**
 * Investor observation templates. Original wording; informed by the general scope of property-condition screening
 * practice (ASTM E2018-style categories, GSE multifamily assessment topics) without reproducing any standard's text.
 * These are screening prompts for an investor's own walk. They do not replace a property condition assessment,
 * structural, environmental, accessibility or code review by qualified professionals.
 */
import type { AssetClass } from "@/db/schema";

export interface TemplateItem { key: string; prompt: string; hint?: string }
export interface TemplateCategory { key: string; number: number; title: string; items: TemplateItem[] }
export interface InspectionTemplate { slug: string; assetClass: AssetClass; title: string; categories: TemplateCategory[] }

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  multifamily: "Multifamily", single_family_rental: "Single-family rental", industrial: "Industrial", retail: "Retail", office: "Office", hospitality: "Hospitality", mixed_use: "Mixed-use",
};

export const WALK_SAFETY_NOTICE = "Walk only areas you are lawfully permitted to enter. Do not enter restricted areas, climb onto roofs, open electrical panels or enter mechanical spaces unless you are authorised and accompanied by qualified personnel. Do not photograph tenants, occupied units or private documents without permission.";
export const WALK_LIMITS_NOTICE = "Investor screening observations only. This is not a property condition assessment, structural, environmental, accessibility or code review. Hidden conditions cannot be classified from what you can see or photograph; mark them as needing a specialist.";

const i = (key: string, prompt: string, hint?: string): TemplateItem => ({ key, prompt, hint });

const SHARED: Record<string, { number: number; title: string; items: TemplateItem[] }> = {
  market: { number: 1, title: "Market and neighbourhood", items: [
    i("market.demand", "What visible signs show demand for this location (occupancy of nearby buildings, new construction, active employers)?"),
    i("market.nearby", "What is the condition and use of the adjacent properties and the surrounding blocks?"),
    i("market.competition", "Which comparable properties did you see nearby, and how do their condition and advertised rents compare?", "Record the address or name, not a guess at their numbers."),
    i("market.nuisance", "Do you notice noise, odours, vacant lots, boarded buildings or other nearby conditions that could affect leasing?"),
  ] },
  access: { number: 2, title: "Access, transportation and surrounding economic activity", items: [
    i("access.entry", "How easy and safe is vehicle entry and exit, including turning movements at the main drive?"),
    i("access.transit", "What transit, major roads and walking routes serve the site?"),
    i("access.amenities", "What shopping, employment and services are within a short drive or walk?"),
  ] },
  site_drainage: { number: 3, title: "Site infrastructure and drainage", items: [
    i("site.grading", "Does the ground slope away from buildings? Note ponding, erosion, staining or wet soil."),
    i("site.drains", "Are storm drains, gutters and downspouts visible and clear? Where does the water go?"),
    i("site.utilities", "What site utilities are visible (meters, transformers, cleanouts) and do any look damaged or poorly kept?"),
    i("site.retaining", "Do walls, fences or retaining structures show leaning, cracking or movement?"),
  ] },
  parking_site: { number: 4, title: "Parking, landscaping and lighting", items: [
    i("parking.surface", "What is the condition of the paving: cracking pattern, potholes, patching, faded striping?"),
    i("parking.count", "Is the parking count and layout adequate for the property's use, with accessible spaces marked?"),
    i("parking.lighting", "At the time of your visit, are fixtures present and working? Note any dark areas you would revisit after dusk."),
    i("parking.landscape", "Is landscaping maintained, and does vegetation touch buildings or hide sight lines?"),
    i("parking.waste", "Are dumpster enclosures sound, screened and kept clear?"),
  ] },
  exterior: { number: 5, title: "Exterior structure and building envelope", items: [
    i("exterior.walls", "What do the walls and cladding show: cracks, rot, staining, loose or missing material?"),
    i("exterior.windows", "Are windows and doors intact and sealed? Note broken glazing, failed seals or rot."),
    i("exterior.balconies", "Condition of balconies, decks, stairs and railings as visible from permitted areas."),
    i("exterior.sealants", "Do sealants, flashing and trim look maintained or deteriorated?"),
  ] },
  roof: { number: 6, title: "Roof observations", items: [
    i("roof.visible", "From the ground or permitted vantage points, what is visible: type, patches, ponding marks, debris, sagging lines?", "Do not climb onto a roof."),
    i("roof.interior", "Are there ceiling stains, bubbling paint or odours below the roof that suggest leaks?"),
    i("roof.age", "What roof age and repair history does the seller state, and what documents back it up?", "Record what you were told and what you could verify separately."),
  ] },
  mep: { number: 7, title: "Visible mechanical, electrical and plumbing", items: [
    i("mep.hvac", "What heating and cooling equipment is visible and what is its apparent age and condition?"),
    i("mep.water", "Water heating, supply and drainage: age plates, corrosion, leaks, staining or repairs visible?"),
    i("mep.electrical", "Visible electrical conditions from public areas: exposed wiring, damaged fixtures, labelled panels you were shown by staff.", "Do not open panels yourself."),
    i("mep.metering", "How are utilities metered and billed (owner-paid, sub-metered, tenant-paid)?"),
  ] },
  common: { number: 9, title: "Common areas and amenities", items: [
    i("common.halls", "Condition and cleanliness of corridors, lobbies, stairwells and shared entries."),
    i("common.amenities", "Are advertised amenities present, usable and clean (pool, fitness, laundry, clubhouse, loading areas)?"),
    i("common.office", "How does the leasing or management office present itself, and what records can staff show you?"),
  ] },
  maintenance_ops: { number: 10, title: "Maintenance operations", items: [
    i("ops.shop", "Is there a maintenance shop or storage? Does inventory and organisation suggest an active programme?"),
    i("ops.orders", "How are service requests taken and tracked, and what is the typical response time?"),
    i("ops.turnover", "How are vacant units turned over, and how many are offline or awaiting work?"),
    i("ops.vendors", "Which work is done in-house and which by contractors, and where are the invoices kept?"),
  ] },
  life_safety: { number: 11, title: "Life-safety concerns", items: [
    i("safety.egress", "Are exits, corridors and stairs clear, lit and free of obstruction?"),
    i("safety.alarms", "Smoke and fire alarm devices, extinguishers and inspection tags: visible, current, working?"),
    i("safety.rails", "Guards, handrails and stair treads: loose, missing, or at obvious risk of failure?"),
    i("safety.security", "Visible security measures: locks, cameras, gates, lighting; signs of break-ins or vandalism."),
  ] },
  accessibility: { number: 12, title: "Apparent accessibility concerns", items: [
    i("access.route", "Is there an apparent accessible route from parking and the public way to entrances and common spaces?"),
    i("access.features", "Visible barriers such as steps without ramps, narrow doors, missing signage or unmarked accessible spaces."),
  ] },
  environmental: { number: 13, title: "Potential environmental and insurance exposure", items: [
    i("env.moisture", "Visible mould, standing water or persistent damp conditions."),
    i("env.materials", "Age-related material concerns you should ask a specialist about (pre-1980 construction, tanks, chemical storage, nearby industrial use)."),
    i("env.flood", "Signs of past flooding, proximity to water or low ground, and any flood-zone information the seller provided."),
    i("env.insurance", "Features an insurer would ask about: roof age, wiring type, plumbing type, fire protection, claims history."),
  ] },
  tenant_mgmt: { number: 14, title: "Tenant experience and property management", items: [
    i("tenant.presentation", "First impressions as a visitor: signage, cleanliness, staff attitude, resident or tenant activity."),
    i("tenant.complaints", "Are there visible resident or tenant complaints, notices, or recurring problems you were told about?"),
    i("tenant.policies", "What do staff say about lease terms, concessions, renewals and collections?", "Record what you were told. Do not record conversations without permission."),
  ] },
  deferred: { number: 15, title: "Deferred maintenance", items: [
    i("deferred.visible", "List the repairs that look overdue: peeling paint, patched failures, rust, rot, broken fixtures."),
    i("deferred.pattern", "Does the same problem repeat across buildings or units, suggesting a systemic cause?"),
    i("deferred.reported", "Compare what you see with the repair spending the seller reports."),
  ] },
  value_add: { number: 16, title: "Renovation and value-add opportunities", items: [
    i("value.interiors", "Which interiors or finishes are original or dated, and which have been renovated?"),
    i("value.premium", "What evidence is there that renovated space leases for more, and where does that evidence come from?"),
    i("value.operations", "Operational improvements you could pursue: billing back utilities, fees, parking, storage, management."),
    i("value.cost", "What would each improvement cost, and who would give you a quote?", "Do not treat your own guess as a quote."),
  ] },
};

const INTERIORS: Record<AssetClass, { title: string; items: TemplateItem[] }> = {
  multifamily: { title: "Apartment unit interiors", items: [
    i("unit.occupied", "In a representative occupied unit shown with the resident's permission: kitchen, bath, flooring, windows, appliances."),
    i("unit.vacant", "In vacant units: condition, what work is needed to re-lease, and how long they have been vacant."),
    i("unit.offline", "Are any units down or offline for damage or renovation? Which, and why?"),
    i("unit.moisture", "Signs of past or current water intrusion: stains, soft flooring, odours, mould."),
  ] },
  single_family_rental: { title: "Dwelling interior", items: [
    i("home.kitchen", "Kitchen and bath condition, fixtures and visible plumbing leaks."),
    i("home.floors", "Floors, walls and ceilings: cracks, stains, sloping or soft spots."),
    i("home.systems", "Visible heating, cooling and water-heating equipment and their apparent age."),
    i("home.turnover", "What work would make this ready for a new tenant?"),
  ] },
  industrial: { title: "Building interior and shell", items: [
    i("ind.clear", "Clear height, column spacing and usable layout for target tenants."),
    i("ind.floor", "Slab condition: cracks, settlement, staining, load signs."),
    i("ind.docks", "Dock doors, levellers and truck courts: count, function and wear."),
    i("ind.power", "Visible power service, lighting and fire protection and their apparent age."),
  ] },
  retail: { title: "Tenant spaces and storefronts", items: [
    i("ret.storefront", "Storefront glazing, signage and entries: condition and visibility."),
    i("ret.vacant", "Vacant spaces: condition, size, and what is needed to re-lease."),
    i("ret.traffic", "Customer traffic at the time of your visit; which tenants draw visitors."),
    i("ret.rear", "Service corridors, loading and rear access."),
  ] },
  office: { title: "Suites, lobbies and building interiors", items: [
    i("off.lobby", "Lobby, elevators and common corridors: condition and finish level."),
    i("off.suites", "Vacant and occupied suites you can see: finish level, layout efficiency, natural light."),
    i("off.hvac", "Comfort and air-handling equipment, as visible and as staff describe."),
    i("off.restrooms", "Restrooms and core areas: condition and accessibility."),
  ] },
  hospitality: { title: "Guest rooms and public spaces", items: [
    i("hos.rooms", "Guest rooms you are shown: bedding, bath, fixtures, furniture wear, odours."),
    i("hos.lobby", "Lobby, breakfast areas and corridors: presentation and cleanliness."),
    i("hos.back", "Laundry, storage and back-of-house operations."),
    i("hos.brand", "Brand or flag requirements staff mention that would require renovation."),
  ] },
  mixed_use: { title: "Residential and commercial spaces", items: [
    i("mix.resi", "Residential unit interiors you are shown: kitchen, bath, flooring, windows."),
    i("mix.comm", "Commercial space interiors: storefront, finish level, vacancy."),
    i("mix.separation", "Separation between uses: fire separation, entrances, noise, shared systems."),
    i("mix.shared", "Which utilities and systems are shared between uses and how costs are split."),
  ] },
};

const SPECIFIC: Record<AssetClass, TemplateItem[]> = {
  multifamily: [
    i("mf.mix", "Does the unit mix in the rent roll match what you see and what the marketing says?"),
    i("mf.laundry", "Laundry arrangements, storage and any income-producing amenities."),
    i("mf.pets", "Pet policy, fees and visible pet waste or damage."),
    i("mf.parkingratio", "Parking spaces per unit compared with demand you observe."),
  ],
  single_family_rental: [
    i("sfr.hoa", "Is there an association with rules, fees or restrictions on rentals?"),
    i("sfr.lot", "Lot drainage, trees near the structure and fencing."),
    i("sfr.comps", "Nearby rentals and their condition."),
  ],
  industrial: [
    i("indx.truck", "Truck turning radius, trailer parking and queueing."),
    i("indx.outside", "Outdoor storage use, stormwater and spill-control features."),
    i("indx.tenant", "Tenant operations visible and any hazardous-material signage."),
  ],
  retail: [
    i("retx.anchor", "Anchor and co-tenancy relationships and what leases allow."),
    i("retx.visibility", "Signage, pylon visibility and access from the main road."),
    i("retx.pads", "Pad sites and outparcel conditions."),
  ],
  office: [
    i("offx.floorplate", "Floor plate efficiency and typical tenant size."),
    i("offx.parking", "Parking ratio and structure condition if present."),
    i("offx.vacancy", "Building occupancy visible at the time of your visit."),
  ],
  hospitality: [
    i("hosx.seasonal", "Seasonality and the demand drivers staff describe."),
    i("hosx.fnb", "Food and beverage, meeting space and other revenue areas."),
    i("hosx.ffe", "Furniture, fixtures and equipment replacement cycle staff describe."),
  ],
  mixed_use: [
    i("mixx.leases", "Lease structures for each use and who pays shared costs."),
    i("mixx.zoning", "Zoning and permitted-use questions to ask the broker."),
    i("mixx.parking", "Parking allocation between uses."),
  ],
};

export function buildTemplate(assetClass: AssetClass): InspectionTemplate {
  const cats: TemplateCategory[] = [];
  for (const [key, c] of Object.entries(SHARED)) cats.push({ key, number: c.number, title: c.title, items: c.items });
  const interior = INTERIORS[assetClass];
  cats.push({ key: "interiors", number: 8, title: interior.title, items: interior.items });
  cats.push({ key: "asset_specific", number: 17, title: `${ASSET_CLASS_LABELS[assetClass]}-specific conditions`, items: SPECIFIC[assetClass] });
  cats.sort((a, b) => a.number - b.number);
  return { slug: `${assetClass.replace(/_/g, "-")}-v1`, assetClass, title: `${ASSET_CLASS_LABELS[assetClass]} walk`, categories: cats };
}

export const TEMPLATES: InspectionTemplate[] = (Object.keys(ASSET_CLASS_LABELS) as AssetClass[]).map(buildTemplate);
export const getTemplate = (slug: string): InspectionTemplate | null => TEMPLATES.find((t) => t.slug === slug) ?? null;
export const templateForClass = (c: AssetClass): InspectionTemplate => TEMPLATES.find((t) => t.assetClass === c)!;
export const allItems = (t: InspectionTemplate): Array<TemplateItem & { categoryKey: string; categoryTitle: string }> => t.categories.flatMap((c) => c.items.map((it) => ({ ...it, categoryKey: c.key, categoryTitle: c.title })));

export const SEVERITIES = [
  { value: "information_only", label: "Information only" },
  { value: "minor_maintenance", label: "Minor maintenance" },
  { value: "material_repair", label: "Material repair" },
  { value: "major_capital_replacement", label: "Major capital replacement" },
  { value: "potential_safety_issue", label: "Potential safety issue" },
  { value: "specialist_investigation_required", label: "Specialist investigation required" },
] as const;
export const SEVERITY_LABELS: Record<string, string> = Object.fromEntries(SEVERITIES.map((s) => [s.value, s.label]));

/** Component categories used on findings; also drive the statement-to-site cross-checks. */
export const COMPONENTS = [
  { value: "paving", label: "Paving and parking" }, { value: "roof", label: "Roof" }, { value: "envelope", label: "Exterior and envelope" },
  { value: "structure_visible", label: "Visible structure" }, { value: "plumbing", label: "Plumbing" }, { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "Heating and cooling" }, { value: "interiors", label: "Unit or space interiors" }, { value: "life_safety", label: "Life safety" },
  { value: "drainage", label: "Site drainage" }, { value: "amenities", label: "Amenities and common areas" }, { value: "operations", label: "Operations and management" },
  { value: "environmental", label: "Environmental or moisture" }, { value: "other", label: "Other" },
] as const;
export const COMPONENT_LABELS: Record<string, string> = Object.fromEntries(COMPONENTS.map((c) => [c.value, c.label]));
