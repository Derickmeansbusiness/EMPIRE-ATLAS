/**
 * Research roadmap: subjects queued for future dossiers. Seeded as DRAFT so they appear in the
 * explorer as "in the research queue" and are never presented as published research.
 */
export interface RoadmapInvestor {
  slug: string; fullName: string; shortName: string; bornYear?: number; diedYear?: number;
  headline: string; eraLabel: string; primaryAssetClasses: string[]; roadmapRank: number; researchStatus: "queued" | "in_research";
}

export const roadmapInvestors: RoadmapInvestor[] = [
  { slug: "stephen-ross", fullName: "Stephen M. Ross", shortName: "Stephen Ross", bornYear: 1940, headline: "Financing expertise, subsidised housing and the Related Companies platform.", eraLabel: "1972 – present", primaryAssetClasses: ["Affordable housing", "Mixed-use development", "Office"], roadmapRank: 2, researchStatus: "queued" },
  { slug: "donald-bren", fullName: "Donald L. Bren", shortName: "Donald Bren", bornYear: 1932, headline: "Large-scale land control and master planning through the Irvine Company.", eraLabel: "1958 – present", primaryAssetClasses: ["Master-planned land", "Office", "Apartments", "Retail"], roadmapRank: 3, researchStatus: "queued" },
  { slug: "ray-kroc", fullName: "Raymond A. Kroc", shortName: "Ray Kroc", bornYear: 1902, diedYear: 1984, headline: "A restaurant chain whose economics ran on land and leases.", eraLabel: "1954 – 1984", primaryAssetClasses: ["Net-leased retail", "Operating platform"], roadmapRank: 4, researchStatus: "queued" },
  { slug: "harry-sonneborn", fullName: "Harry J. Sonneborn", shortName: "Harry Sonneborn", bornYear: 1916, diedYear: 1992, headline: "The financial architect of McDonald's real estate model.", eraLabel: "1955 – 1967", primaryAssetClasses: ["Net-leased retail", "Sale-leaseback"], roadmapRank: 5, researchStatus: "queued" },
  { slug: "arnold-schwarzenegger", fullName: "Arnold Schwarzenegger", shortName: "Arnold Schwarzenegger", bornYear: 1947, headline: "Early rental acquisitions and financial independence before Hollywood.", eraLabel: "1968 – present", primaryAssetClasses: ["Small multifamily", "Office"], roadmapRank: 6, researchStatus: "queued" },
  { slug: "john-jacob-astor", fullName: "John Jacob Astor", shortName: "John Jacob Astor", bornYear: 1763, diedYear: 1848, headline: "Strategic Manhattan land accumulation financed by the fur trade.", eraLabel: "1784 – 1848", primaryAssetClasses: ["Urban land", "Ground leases"], roadmapRank: 7, researchStatus: "queued" },
  { slug: "barry-sternlicht", fullName: "Barry S. Sternlicht", shortName: "Barry Sternlicht", bornYear: 1960, headline: "Institutional distressed and hospitality investing through Starwood.", eraLabel: "1991 – present", primaryAssetClasses: ["Hospitality", "Distressed debt", "Multifamily"], roadmapRank: 8, researchStatus: "queued" },
  { slug: "howard-marks", fullName: "Howard S. Marks", shortName: "Howard Marks", bornYear: 1946, headline: "Credit cycles and capital preservation at Oaktree.", eraLabel: "1978 – present", primaryAssetClasses: ["Distressed debt", "Credit"], roadmapRank: 9, researchStatus: "queued" },
  { slug: "jon-gray", fullName: "Jonathan D. Gray", shortName: "Jon Gray", bornYear: 1970, headline: "Large institutional transactions, including the other side of the Equity Office deal.", eraLabel: "1992 – present", primaryAssetClasses: ["Office", "Logistics", "Hospitality", "Residential"], roadmapRank: 10, researchStatus: "queued" },
  { slug: "john-d-rockefeller-sr", fullName: "John D. Rockefeller Sr.", shortName: "John D. Rockefeller Sr.", bornYear: 1839, diedYear: 1937, headline: "Industrial fortune, land holdings and the capital behind a dynasty.", eraLabel: "1863 – 1937", primaryAssetClasses: ["Industrial", "Land"], roadmapRank: 11, researchStatus: "queued" },
  { slug: "john-d-rockefeller-jr", fullName: "John D. Rockefeller Jr.", shortName: "John D. Rockefeller Jr.", bornYear: 1874, diedYear: 1960, headline: "Rockefeller Center: development through a depression on leased land.", eraLabel: "1911 – 1960", primaryAssetClasses: ["Office development", "Ground leases"], roadmapRank: 12, researchStatus: "queued" },
  { slug: "fred-trump", fullName: "Frederick C. Trump", shortName: "Fred Trump", bornYear: 1905, diedYear: 1999, headline: "Government-insured housing development in Brooklyn and Queens.", eraLabel: "1927 – 1999", primaryAssetClasses: ["Multifamily", "FHA-financed housing"], roadmapRank: 13, researchStatus: "queued" },
  { slug: "donald-trump", fullName: "Donald J. Trump", shortName: "Donald Trump", bornYear: 1946, headline: "Manhattan development, tax abatements, leverage and restructurings.", eraLabel: "1971 – present", primaryAssetClasses: ["Office", "Hospitality", "Residential", "Casinos"], roadmapRank: 14, researchStatus: "queued" },
  { slug: "andrew-carnegie", fullName: "Andrew Carnegie", shortName: "Andrew Carnegie", bornYear: 1835, diedYear: 1919, headline: "Industrial capital, early real estate speculation and philanthropy.", eraLabel: "1850 – 1919", primaryAssetClasses: ["Industrial", "Land"], roadmapRank: 15, researchStatus: "queued" },
  { slug: "bruce-flatt", fullName: "Bruce Flatt", shortName: "Bruce Flatt", bornYear: 1965, headline: "Brookfield: real assets at institutional scale.", eraLabel: "1990 – present", primaryAssetClasses: ["Office", "Infrastructure", "Renewable power"], roadmapRank: 16, researchStatus: "queued" },
];

export interface RoadmapInstitution {
  slug: string; name: string; kind: "company" | "investment_fund" | "ownership_entity" | "operating_company"; headquarters?: string; summary: string;
}

export const roadmapInstitutions: RoadmapInstitution[] = [
  { slug: "related-companies", name: "Related Companies", kind: "company", headquarters: "New York, New York", summary: "Stephen Ross's development firm. Queued." },
  { slug: "irvine-company", name: "Irvine Company", kind: "company", headquarters: "Newport Beach, California", summary: "Donald Bren's master-planning and ownership platform. Queued." },
  { slug: "starwood-capital", name: "Starwood Capital Group", kind: "investment_fund", headquarters: "Miami Beach, Florida", summary: "Barry Sternlicht's investment firm. Queued." },
  { slug: "brookfield", name: "Brookfield", kind: "investment_fund", headquarters: "Toronto / New York", summary: "Bruce Flatt's real-assets manager. Queued." },
  { slug: "oaktree-capital", name: "Oaktree Capital Management", kind: "investment_fund", headquarters: "Los Angeles, California", summary: "Howard Marks's credit manager. Queued." },
  { slug: "mcdonalds", name: "McDonald's Corporation", kind: "operating_company", headquarters: "Chicago, Illinois", summary: "Operating platform with a real estate-backed franchise model. Queued." },
  { slug: "rockefeller-center-development", name: "Rockefeller Center development entities", kind: "ownership_entity", headquarters: "New York, New York", summary: "The entities behind the 1930s development. Queued." },
];
