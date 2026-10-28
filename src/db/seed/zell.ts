/**
 * Sam Zell — founding dossier for EMPIRE ATLAS.
 *
 * Research standard (see docs/RESEARCH_STANDARDS.md):
 *  - Every claim links to at least one source record with a locator or excerpt.
 *  - `verified_primary` is reserved for SEC filings, exchange notices, company filings and
 *    library catalogue records. Obituaries and trade press are `supported_secondary`.
 *  - Where sources disagree the claim is `contested` and the disagreement is written into the text.
 *  - Figures we could not confirm are left out or marked `unverified`. Nothing is estimated silently.
 *
 * Sources were located on 2026-10-28 using web search; direct retrieval of sec.gov and several news
 * sites was blocked in the build environment, so excerpts come from the search index summaries and
 * should be re-verified against the originals by an editor (tracked in researcher_notes).
 */
import type { SeedInvestorDossier } from "./types";

const ACCESSED = "2026-10-28";

export const zellDossier: SeedInvestorDossier = {
  investor: {
    slug: "sam-zell",
    fullName: "Samuel Zell",
    shortName: "Sam Zell",
    bornYear: 1941,
    diedYear: 2023,
    nationality: "United States",
    headline: "The Grave Dancer: distressed property, public REIT capital, and the sale at the top.",
    summary:
      "Chicago investor who built an apartment business as a student, bought distressed property through the 1970s downturn, raised a billion-dollar distressed fund in 1990, took three of the largest REITs public in the 1990s, and sold Equity Office to Blackstone for roughly $39 billion in February 2007 — months before the credit markets broke. His leveraged purchase of Tribune Company the same year ended in bankruptcy within twelve months.",
    eraLabel: "1968 – 2023",
    primaryAssetClasses: ["Multifamily", "Office", "Manufactured housing", "Distressed corporate debt", "Operating companies"],
    roadmapRank: 1,
  },

  sources: [
    { slug: "ap-zell-obituary-2023", title: "Sam Zell, billionaire real estate investor, dies", sourceType: "news", publisher: "Associated Press (via The Boston Globe)", publishedOn: "2023-05-18", url: "https://www.bostonglobe.com/2023/05/18/metro/sam-zell-billionaire-real-estate-investor-dies", accessedOn: ACCESSED, reliabilityNote: "Wire-service obituary; founding date attributed to the firm." },
    { slug: "commercial-observer-zell-obituary-2023", title: "Sam Zell, Real Estate Billionaire, Dead at 81", sourceType: "trade_press", publisher: "Commercial Observer", publishedOn: "2023-05-18", url: "https://commercialobserver.com/2023/05/sam-zell-real-estate-billionaire-dead-at-81/", accessedOn: ACCESSED },
    { slug: "nareit-zell-obituary-2023", title: "Sam Zell, Architect of Modern REIT Era and Former Nareit Chair, Dies at 81", sourceType: "trade_press", publisher: "Nareit (reit.com)", publishedOn: "2023-05-18", url: "https://reit.com/news/articles/sam-zell-architect-of-modern-reit-era-and-former-nareit-chair-dies-at-81", accessedOn: ACCESSED, reliabilityNote: "Industry association; gives 1964 as the EGI founding year, which conflicts with the firm's own 1968." },
    { slug: "wharton-magazine-zell-obituary-2023", title: "Sam Zell (obituary)", sourceType: "other", publisher: "Wharton Magazine", publishedOn: "2023-05-18", url: "https://magazine.wharton.upenn.edu/obituaries/sam-zell/", accessedOn: ACCESSED },
    { slug: "dbusiness-zell-obituary-2023", title: "Billionaire Sam Zell Passes Away at 81; Started Business Empire at U-M", sourceType: "news", publisher: "DBusiness", publishedOn: "2023-05-18", url: "https://www.dbusiness.com/daily-news/billionaire-sam-zell-passes-away-at-81-started-business-empire-at-u-m/", accessedOn: ACCESSED },
    { slug: "britannica-money-zell", title: "Sam Zell", sourceType: "other", publisher: "Encyclopaedia Britannica (Britannica Money)", url: "https://www.britannica.com/money/Sam-Zell", accessedOn: ACCESSED, reliabilityNote: "Tertiary reference; used only to corroborate biographical basics." },
    { slug: "eqr-press-release-2023", title: "Equity Residential Mourns Death of Founder and Chairman Samuel Zell", sourceType: "press_release", publisher: "Equity Residential via Business Wire", publishedOn: "2023-05-18", url: "https://www.businesswire.com/news/home/20230518005532/en/Equity-Residential-Mourns-Death-of-Founder-and-Chairman-Samuel-Zell", accessedOn: ACCESSED },
    { slug: "eqr-10k-fy1996", title: "Equity Residential Properties Trust — Form 10-K for fiscal year 1996", sourceType: "sec_filing", publisher: "U.S. Securities and Exchange Commission (EDGAR)", documentReference: "CIK 0000906107, accession 0000950131-97-001984", publishedOn: "1997-03-31", url: "https://www.sec.gov/Archives/edgar/data/0000906107/000095013197001984/0000950131-97-001984.txt", accessedOn: ACCESSED, reliabilityNote: "Primary. Item 1, Business." },
    { slug: "eop-424b3-1998", title: "Equity Office Properties Trust — Prospectus (Form 424B3), 1998", sourceType: "sec_filing", publisher: "U.S. Securities and Exchange Commission (EDGAR)", documentReference: "CIK 0001038339, accession 0000950137-98-002586", publishedOn: "1998-01-01", url: "https://www.sec.gov/Archives/edgar/data/0001038339/000095013798002586/0000950137-98-002586.txt", accessedOn: ACCESSED, reliabilityNote: "Primary. Describes the July 1997 IPO and use of proceeds." },
    { slug: "eop-8k-2007-amended-merger", title: "Equity Office Properties Trust — Form 8-K, Exhibit 99.1 (press release: amended merger agreement with Blackstone affiliates)", sourceType: "sec_filing", publisher: "U.S. Securities and Exchange Commission (EDGAR)", documentReference: "CIK 0001038339, accession 0000950134-07-002109, EX-99.1", publishedOn: "2007-02-01", url: "https://www.sec.gov/Archives/edgar/data/1038339/000095013407002109/c12076exv99w1.htm", accessedOn: ACCESSED, reliabilityNote: "Primary company press release filed with the SEC." },
    { slug: "eop-8k-2007-shareholder-vote", title: "Equity Office Properties Trust — Form 8-K (shareholders approve merger), February 2007", sourceType: "sec_filing", publisher: "U.S. Securities and Exchange Commission (EDGAR)", documentReference: "CIK 0001038339, accession 0000950137-07-001651", publishedOn: "2007-02-07", url: "https://www.sec.gov/Archives/edgar/data/0001038339/000095013707001651/c12110e8vk.htm", accessedOn: ACCESSED },
    { slug: "nasdaq-phlx-memo-0349-07", title: "PHLX memo 0349-07: Equity Office Properties Trust merger effective February 9, 2007", sourceType: "exchange_notice", publisher: "Nasdaq Trader (Philadelphia Stock Exchange)", publishedOn: "2007-02-09", url: "https://www.nasdaqtrader.com/content/phlxmemos/2007/feb/0349-07.pdf", accessedOn: ACCESSED, reliabilityNote: "Exchange notice confirming effectiveness and cash consideration." },
    { slug: "nbc-ap-eop-vote-2007", title: "Equity Office shareholders OK $23B takeover", sourceType: "news", publisher: "NBC News (Associated Press)", publishedOn: "2007-02-07", url: "https://www.nbcnews.com/id/wbna17024956", accessedOn: ACCESSED },
    { slug: "pere-vornado-bows-2007", title: "Vornado bows to Blackstone EOP victory", sourceType: "trade_press", publisher: "PERE News", publishedOn: "2007-02-08", url: "https://www.perenews.com/vornado-bows-to-blackstone-eop-victory/", accessedOn: ACCESSED },
    { slug: "therealdeal-blackstone-flip-2007", title: "Blackstone quick to flip EOP assets", sourceType: "trade_press", publisher: "The Real Deal", publishedOn: "2007-07-26", url: "https://therealdeal.com/2007/07/26/blackstone-quick-to-flip-eop-assets/", accessedOn: ACCESSED },
    { slug: "therealdeal-zell-empire-2009", title: "Zell real estate empire crumbles", sourceType: "trade_press", publisher: "The Real Deal", publishedOn: "2009-02-09", url: "https://therealdeal.com/2009/02/09/zell-real-estate-empire-crumbles/", accessedOn: ACCESSED },
    { slug: "blackstone-eop-retrospective", title: "The $39bn buyout that made Blackstone's reputation as a real estate investor", sourceType: "other", publisher: "Blackstone (corporate website)", url: "https://www.blackstone.com/?p=49369", accessedOn: ACCESSED, reliabilityNote: "Buyer's own retrospective; self-interested but direct on timing of resales." },
    { slug: "bisnow-eop-profit", title: "The $39B EOP Deal Should Have Killed Blackstone. Instead It Reaped A $7B Profit", sourceType: "trade_press", publisher: "Bisnow", url: "https://www.bisnow.com/news/new-york/capital-markets/39b-eop-deal-should-have-killed-blackstone-instead-it-reaped-a-7b-profit-101282", accessedOn: ACCESSED, reliabilityNote: "Cites The Wall Street Journal for the equity and profit figures; WSJ original not retrieved." },
    { slug: "zell-memoir-catalog-2017", title: "Am I Being Too Subtle? Straight Talk from a Business Rebel (library catalogue record)", sourceType: "book", publisher: "Portfolio / Penguin", author: "Sam Zell", publishedOn: "2017-05-09", documentReference: "ISBN 9781591848233", url: "https://catalog.schaumburglibrary.org/Record/1494966", accessedOn: ACCESSED, licensingNote: "Copyrighted work. Only bibliographic metadata and short quotations are stored." },
    { slug: "zell-grave-dancer-1976", title: "The Grave Dancer: A guide to the risky art of resurrecting dead properties", sourceType: "trade_press", publisher: "Real Estate Review (attribution contested; one secondary source names an NYU review)", author: "Sam Zell", publishedOn: "1976-01-01", accessedOn: ACCESSED, reliabilityNote: "Original not retrieved; cited through CoStar and other secondary summaries.", licensingNote: "Copyrighted article; short quotations only." },
    { slug: "costar-zell-remembered-2023", title: "Billionaire Real Estate Investor Sam Zell Remembered for Revolutionizing His Industry", sourceType: "trade_press", publisher: "CoStar News", publishedOn: "2023-05-18", url: "https://www.costar.com/article/1955749831/billionaire-real-estate-investor-sam-zell-remembered-for-revolutionizing-his-industry", accessedOn: ACCESSED },
    { slug: "buyouts-1991-distressed", title: "1991's Distressed Distressed Market", sourceType: "trade_press", publisher: "Buyouts (Buyouts Insider)", url: "https://www.buyoutsinsider.com/1991s-distressed-distressed-market/", accessedOn: ACCESSED, reliabilityNote: "Contemporaneous trade reporting on the 1990–91 distressed fund market." },
    { slug: "fundinguniverse-eop-history", title: "Equity Office Properties Trust — Company History", sourceType: "other", publisher: "FundingUniverse (International Directory of Company Histories)", url: "https://www.fundinguniverse.com/company-histories/equity-office-properties-trust-history/", accessedOn: ACCESSED, reliabilityNote: "Secondary compilation; useful for chronology, figures need corroboration." },
    { slug: "fortune-tribune-hell-2008", title: "For Zell, more Tribune hell", sourceType: "news", publisher: "Fortune (CNNMoney)", author: "Richard Siklos", publishedOn: "2008-09-19", url: "https://money.cnn.com/2008/09/19/magazines/fortune/zell_suit_siklos.fortune/", accessedOn: ACCESSED },
    { slug: "courthousenews-tribune-esop", title: "Tribune ESOP / leveraged buyout litigation coverage", sourceType: "news", publisher: "Courthouse News Service", url: "https://www.courthousenews.com/tribune-trustee-cant-cap-damages-at-15m/", accessedOn: ACCESSED, reliabilityNote: "Reports figures from court filings and rulings." },
    { slug: "planadviser-esop-settlement", title: "Settlement Reached in ESOP Fiduciary Breach Suit", sourceType: "trade_press", publisher: "PLANADVISER", url: "https://www.planadviser.com/settlement-reached-in-esop-fiduciary-breach-suit/", accessedOn: ACCESSED },
    { slug: "columbia-chazen-equity-international", title: "Equity International's Real Estate Investments in Brazil (case study)", sourceType: "academic", publisher: "Columbia Business School, Chazen Institute", url: "https://business.columbia.edu/sites/default/files-efs/pubfiles/3224/Equity%20International's%20Real%20Estate%20Investments%20in%20Brazil.pdf", accessedOn: ACCESSED },
    { slug: "pere-equity-international-speedboat", title: "The little speedboat that could", sourceType: "trade_press", publisher: "PERE News", url: "https://www.perenews.com/the-little-speedboat-that-could/", accessedOn: ACCESSED },
    { slug: "rebusiness-zell-obituary-2023", title: "Billionaire Real Estate Investor Sam Zell, Champion of REIT Model, Dies at 81", sourceType: "trade_press", publisher: "REBusinessOnline", publishedOn: "2023-05-18", url: "https://rebusinessonline.com/billionaire-real-estate-investor-sam-zell-dies-at-81/", accessedOn: ACCESSED },
  ],

  institutions: [
    { slug: "equity-group-investments", name: "Equity Group Investments", kind: "investment_fund", headquarters: "Chicago, Illinois", summary: "Zell's private investment firm; the holding platform for his real estate and corporate investments.", published: true },
    { slug: "equity-residential", name: "Equity Residential", kind: "ownership_entity", foundedYear: 1993, headquarters: "Chicago, Illinois", summary: "Apartment REIT formed in March 1993 to carry on the multifamily business of Zell-controlled entities; listed on the NYSE in August 1993.", published: true },
    { slug: "equity-office-properties-trust", name: "Equity Office Properties Trust", kind: "ownership_entity", foundedYear: 1997, headquarters: "Chicago, Illinois", summary: "Office REIT taken public in July 1997 and sold to Blackstone affiliates in February 2007.", published: true },
    { slug: "equity-lifestyle-properties", name: "Equity LifeStyle Properties", kind: "ownership_entity", headquarters: "Chicago, Illinois", summary: "Manufactured-home community and resort REIT founded by Zell (formerly Manufactured Home Communities).", published: true },
    { slug: "blackstone", name: "Blackstone", kind: "investment_fund", foundedYear: 1985, headquarters: "New York, New York", summary: "Private equity and real estate manager; funds it manages acquired Equity Office in 2007.", published: true },
    { slug: "vornado-realty-trust", name: "Vornado Realty Trust", kind: "ownership_entity", headquarters: "New York, New York", summary: "Office REIT that led the competing consortium bid for Equity Office in early 2007.", published: true },
    { slug: "zell-chilmark-fund", name: "Zell/Chilmark Fund", kind: "investment_fund", foundedYear: 1990, headquarters: "Chicago, Illinois", summary: "Roughly $1 billion distressed-company fund formed with Chilmark Partners.", published: true },
    { slug: "tribune-company", name: "Tribune Company", kind: "operating_company", headquarters: "Chicago, Illinois", summary: "Media company taken private in 2007 through an employee stock ownership plan structure led by Zell.", published: true },
    { slug: "equity-international", name: "Equity International", kind: "investment_fund", foundedYear: 1999, headquarters: "Chicago, Illinois", summary: "Emerging-markets real estate investor founded by Zell and Gary Garrabrant.", published: true },
    { slug: "macklowe-properties", name: "Macklowe Properties", kind: "company", headquarters: "New York, New York", summary: "Harry Macklowe's firm; bought eight Manhattan EOP towers from Blackstone in 2007.", published: true },
    { slug: "beacon-capital-partners", name: "Beacon Capital Partners", kind: "investment_fund", headquarters: "Boston, Massachusetts", summary: "Bought Equity Office's Washington, D.C. portfolio from Blackstone in April 2007.", published: true },
    { slug: "greatbanc-trust", name: "GreatBanc Trust Company", kind: "bank", summary: "Trustee of the Tribune employee stock ownership plan.", published: true },
  ],

  claims: [
    {
      slug: "zell-born-chicago-1941", category: "origins", eventDate: "1941-09-28", eventDatePrecision: "month", status: "supported_secondary",
      text: "Samuel Zell was born in Chicago in 1941 to Jewish parents who had fled Poland; his father changed the family name from Zielonka to Zell.",
      notes: "Sources agree on 1941 and Chicago; the day is given as September 27 in one and September 28 in another. Stored at month precision.",
      sources: [
        { source: "ap-zell-obituary-2023", excerpt: "Born in Chicago in 1941 to Jewish immigrants who had escaped Poland." },
        { source: "britannica-money-zell", excerpt: "His father Bernard changed the family name from Zielonka to Zell shortly after the family moved to Chicago." },
      ],
    },
    {
      slug: "zell-michigan-jd-1966", category: "origins", eventDate: "1966-01-01", eventDatePrecision: "year", status: "supported_secondary",
      text: "Zell earned a J.D. from the University of Michigan Law School in 1966.",
      sources: [
        { source: "dbusiness-zell-obituary-2023", excerpt: "Graduated with a J.D. from the University of Michigan Law School." },
        { source: "britannica-money-zell", locator: "Education" },
      ],
    },
    {
      slug: "zell-lurie-student-apartments", category: "origins", eventDate: "1963-01-01", eventDatePrecision: "circa", status: "supported_secondary",
      text: "While students at the University of Michigan, Zell and Robert Lurie ran an apartment management business in Ann Arbor; that business is described as the predecessor of Equity Residential.",
      sources: [
        { source: "nareit-zell-obituary-2023", excerpt: "…after the two had run an apartment management business together while attending the University of Michigan. That business was the predecessor company to Equity Residential…" },
        { source: "dbusiness-zell-obituary-2023", locator: "Headline: 'Started Business Empire at U-M'" },
      ],
    },
    {
      slug: "egi-founding-year", category: "origins", eventDate: "1968-01-01", eventDatePrecision: "year", status: "contested",
      text: "Zell founded Equity Group Investments in Chicago. The firm itself gives 1968 as the founding year (reported by the Associated Press and Commercial Observer); Nareit's obituary gives 1964.",
      notes: "Conflict between the firm's own statement (1968) and Nareit (1964). The platform records 1968 as the working date because it is attributed to the firm, and flags the claim as contested until a primary record is located.",
      sources: [
        { source: "ap-zell-obituary-2023", excerpt: "In 1968, Zell founded Equity Group Investments, with Lurie joining a year later, according to the firm." },
        { source: "commercial-observer-zell-obituary-2023", excerpt: "Dates the firm to 1968 with Lurie joining a year later." },
        { source: "nareit-zell-obituary-2023", excerpt: "Zell founded Equity Group Investments in 1964 with partner Robert Lurie…", supports: false },
      ],
    },
    {
      slug: "lurie-partner-died-1990", category: "networks", eventDate: "1990-01-01", eventDatePrecision: "year", status: "supported_secondary",
      text: "Robert Lurie was Zell's long-time business partner at Equity Group Investments and died in 1990.",
      sources: [
        { source: "nareit-zell-obituary-2023", excerpt: "…partner Robert Lurie, who passed away in 1990…" },
        { source: "wharton-magazine-zell-obituary-2023", locator: "Samuel Zell and Robert Lurie Real Estate Center" },
      ],
    },
    {
      slug: "zell-multifamily-since-1969", category: "initial_acquisitions", eventDate: "1969-01-01", eventDatePrecision: "year", status: "verified_primary",
      text: "Entities controlled by Zell had been engaged in the multifamily property business since 1969, according to Equity Residential's 1996 annual report on Form 10-K.",
      sources: [
        { source: "eqr-10k-fy1996", locator: "Item 1. Business", excerpt: "The Company was formed to continue the multifamily property business objectives and acquisition strategies of certain affiliated entities controlled by Mr. Samuel Zell… [in the multifamily business since 1969]." },
      ],
    },
    {
      slug: "grave-dancer-essay-1976", category: "strategy", eventDate: "1976-01-01", eventDatePrecision: "year", status: "supported_secondary",
      text: "In 1976 Zell published an essay titled 'The Grave Dancer' describing how he analysed, bought and restructured distressed properties during the mid-1970s real estate downturn; the nickname followed him for the rest of his career.",
      notes: "The venue is usually given as Real Estate Review; one Morningstar piece names a New York University review. Original article not retrieved.",
      sources: [
        { source: "costar-zell-remembered-2023", excerpt: "Zell wrote an essay in 1976 titled 'The Grave Dancer: A guide to the risky art of resurrecting dead properties.'" },
        { source: "zell-grave-dancer-1976" },
      ],
    },
    {
      slug: "zell-chilmark-fund-1990", category: "financing", eventDate: "1990-01-01", eventDatePrecision: "year", status: "supported_secondary", institution: "zell-chilmark-fund",
      text: "The Zell/Chilmark Fund, formed with Chilmark Partners in 1990, raised roughly $1 billion to take ownership stakes in financially distressed companies.",
      notes: "Buyouts (contemporaneous) says 1990; some later secondary accounts say 1991. Fund size is reported, not taken from an offering document.",
      sources: [
        { source: "buyouts-1991-distressed", excerpt: "…the largest fund being raised was the Chilmark Partners Zell/Chilmark Fund, formed in 1990, which had raised $1 billion to date." },
      ],
    },
    {
      slug: "carter-hawley-hale-1991", category: "initial_acquisitions", eventDate: "1991-01-01", eventDatePrecision: "year", status: "supported_secondary", institution: "zell-chilmark-fund",
      text: "In 1991 the Zell/Chilmark Fund bought junk bonds and vendor claims against the parent of department store operator Carter Hawley Hale and eventually took control of the company.",
      sources: [
        { source: "buyouts-1991-distressed", excerpt: "Sam Zell, the 'Grave Dancer,' who raised more than $1 billion to take ownership stakes in needy companies like department store operator Carter Hawley Hale." },
      ],
    },
    {
      slug: "schwinn-1993-1997", category: "failures", eventDate: "1993-01-01", eventDatePrecision: "year", status: "unverified", institution: "zell-chilmark-fund",
      text: "A single secondary company history reports that the Zell/Chilmark Fund bought bicycle maker Schwinn out of bankruptcy in 1993 for about $60 million and sold it in 1997 for about $86 million.",
      notes: "Figures come from one tertiary compilation and have not been corroborated. Not to be cited as fact.",
      sources: [
        { source: "fundinguniverse-eop-history", excerpt: "…bought the bicycle maker out of bankruptcy in 1993, reportedly for $60 million, and sold it in 1997 for $86 million." },
      ],
    },
    {
      slug: "eqr-ipo-august-1993", category: "financing", eventDate: "1993-08-18", status: "verified_primary", institution: "equity-residential",
      text: "Equity Residential Properties Trust was organized in March 1993 and commenced operations on August 18, 1993 upon completion of its initial public offering of 13,225,000 common shares.",
      sources: [
        { source: "eqr-10k-fy1996", locator: "Item 1. Business", excerpt: "The Company was organized in March 1993 and commenced operations on August 18, 1993 upon completion of its initial public offering (the 'IPO')." },
        { source: "eqr-press-release-2023", excerpt: "…took the company public on the NYSE in August 1993." },
      ],
    },
    {
      slug: "eop-ipo-july-1997", category: "financing", eventDate: "1997-07-11", status: "verified_primary", institution: "equity-office-properties-trust",
      text: "Equity Office Properties Trust completed its initial public offering on July 11, 1997, selling 28.75 million common shares at $21.00 per share (about $603.8 million gross including the underwriters' over-allotment), with part of the proceeds used to repay roughly $678.4 million of debt.",
      sources: [
        { source: "eop-424b3-1998", locator: "Prospectus summary / Use of proceeds", excerpt: "…completed its IPO on July 11, 1997… 28.75 million common shares at $21 each… proceeds used in part to repay approximately $678.4 million of debt." },
      ],
    },
    {
      slug: "eop-largest-office-landlord", category: "portfolio", eventDate: "2007-02-01", eventDatePrecision: "month", status: "supported_secondary", institution: "equity-office-properties-trust",
      text: "At the time of its sale in 2007, Equity Office was described as the largest publicly traded office landlord in the United States.",
      sources: [
        { source: "nbc-ap-eop-vote-2007", excerpt: "…the nation's largest publicly traded office landlord." },
        { source: "eop-424b3-1998", excerpt: "Describes the company as the country's largest office owner (1998)." },
      ],
    },
    {
      slug: "eop-amended-merger-55-50", category: "transaction", eventDate: "2007-02-01", eventDatePrecision: "month", status: "verified_primary", transaction: "equity-office-sale-2007", institution: "equity-office-properties-trust",
      text: "In February 2007 Equity Office amended its merger agreement with affiliates of The Blackstone Group, raising the cash consideration to $55.50 per common share and valuing the transaction at approximately $39 billion including debt.",
      sources: [
        { source: "eop-8k-2007-amended-merger", locator: "Exhibit 99.1", excerpt: "Equity Office Properties Trust (NYSE: EOP) today announced that it has amended its merger agreement with affiliates of The Blackstone Group… $55.50 per share… approximately $39 billion." },
      ],
    },
    {
      slug: "eop-vornado-competing-bid", category: "negotiation", eventDate: "2007-02-01", eventDatePrecision: "month", status: "supported_secondary", transaction: "equity-office-sale-2007", institution: "vornado-realty-trust",
      text: "A consortium led by Vornado Realty Trust made a competing, non-binding proposal with a stated value of $56 per share and withdrew it hours before the Equity Office shareholder vote, saying the premium needed to top Blackstone's cash offer was not in Vornado's shareholders' interest.",
      sources: [
        { source: "pere-vornado-bows-2007", excerpt: "The Vornado consortium withdrew its offer hours before the shareholder vote…" },
        { source: "nbc-ap-eop-vote-2007" },
      ],
    },
    {
      slug: "eop-shareholder-approval-2007", category: "transaction", eventDate: "2007-02-07", status: "verified_primary", transaction: "equity-office-sale-2007", institution: "equity-office-properties-trust",
      text: "Equity Office common shareholders voted to approve the merger with Blackstone affiliates, with more than 92% of the shares voted cast in favour.",
      notes: "The company's 8-K and press release date the meeting February 7, 2007; a PHLX memo refers to a vote on February 5. The filing is treated as authoritative.",
      sources: [
        { source: "eop-8k-2007-shareholder-vote", excerpt: "…common shareholders voted to approve the merger and merger agreement with affiliates of The Blackstone Group… over 92% of the total shares that voted were in favor." },
        { source: "nasdaq-phlx-memo-0349-07", supports: false, excerpt: "Refers to a shareholder vote on February 5." },
      ],
    },
    {
      slug: "eop-merger-effective-2007-02-09", category: "transaction", eventDate: "2007-02-09", status: "verified_primary", transaction: "equity-office-sale-2007", institution: "blackstone",
      text: "The merger became effective on Friday, February 9, 2007; each Equity Office common share was converted into the right to receive $55.50 in cash.",
      sources: [
        { source: "nasdaq-phlx-memo-0349-07", excerpt: "The merger became effective on Friday, February 9, 2007… each share was converted into the right to receive $55.50 in cash." },
      ],
    },
    {
      slug: "eop-value-equity-plus-debt", category: "capital_structure", eventDate: "2007-02-07", status: "supported_secondary", transaction: "equity-office-sale-2007",
      text: "Contemporaneous reporting split the roughly $39 billion headline value into more than $22 billion paid for the equity and about $17 billion of debt.",
      notes: "The equity/debt split is from wire reporting, not from the merger agreement itself. One outlet gives 'over $38 billion' as the total.",
      sources: [
        { source: "nbc-ap-eop-vote-2007", excerpt: "…the firm's offer of more than $22 billion plus $17 billion in debt, or a total of $39 billion." },
      ],
    },
    {
      slug: "blackstone-resales-27b-2007", category: "subsequent_events", eventDate: "2007-07-01", eventDatePrecision: "month", status: "supported_secondary", transaction: "equity-office-sale-2007", institution: "blackstone",
      text: "Within about five months of closing, Blackstone resold roughly $27 billion of the Equity Office portfolio, including eight Manhattan buildings to Harry Macklowe's affiliates for about $7 billion and the Washington, D.C. portfolio to Beacon Capital Partners for about $6.5 billion.",
      sources: [
        { source: "therealdeal-blackstone-flip-2007", excerpt: "…sold 8 buildings to affiliates of Harry Macklowe for $7 billion… In April 2007, the company sold its portfolio in Washington, D.C. to Beacon Capital Partners for $6.5 billion." },
        { source: "blackstone-eop-retrospective", excerpt: "…flipping $27 billion in assets within five months of the buyout's closing…" },
      ],
    },
    {
      slug: "blackstone-eop-equity-and-profit", category: "capital_structure", eventDate: "2007-02-09", status: "supported_secondary", transaction: "equity-office-sale-2007", institution: "blackstone",
      text: "Blackstone is reported to have put about $3.5 billion of fund equity into the Equity Office purchase and, over subsequent years, to have sold the portfolio for a combined $46 billion, a profit of roughly $7 billion (Bisnow, citing The Wall Street Journal).",
      notes: "Single trade-press source citing the WSJ. The equity figure has not been confirmed from a Blackstone filing or fund report, so it is recorded as reported, not documented.",
      sources: [
        { source: "bisnow-eop-profit", excerpt: "…sell the portfolio for a combined $46B, according to The Wall Street Journal, a $7B profit, and triple the $3.5B equity the company originally put into the deal." },
      ],
    },
    {
      slug: "macklowe-lost-towers-2008", category: "subsequent_events", eventDate: "2008-01-01", eventDatePrecision: "year", status: "supported_secondary", transaction: "equity-office-sale-2007", institution: "macklowe-properties",
      text: "Harry Macklowe subsequently lost seven of the former Equity Office towers after he was unable to refinance the short-term debt used to buy them.",
      sources: [
        { source: "therealdeal-zell-empire-2009", excerpt: "In New York City, Harry Macklowe has already lost seven Equity Office towers after he was unable to refinance his debt." },
      ],
    },
    {
      slug: "tribune-lbo-2007", category: "failures", eventDate: "2007-01-01", eventDatePrecision: "year", status: "supported_secondary", institution: "tribune-company",
      text: "In 2007 Zell led the roughly $8.2 billion leveraged buyout that took Tribune Company private through an employee stock ownership plan (ESOP); a federal court ruling described the company borrowing about $12 billion to repurchase its public shares.",
      sources: [
        { source: "courthousenews-tribune-esop", excerpt: "…an $8.2 billion leveraged buyout led by real estate investor Sam Zell in 2007, which took the company private through an employee stock ownership plan… borrowed about $12 billion…" },
        { source: "fortune-tribune-hell-2008" },
      ],
    },
    {
      slug: "tribune-esop-250m-2007", category: "capital_structure", eventDate: "2007-04-01", eventDatePrecision: "month", status: "supported_secondary", institution: "tribune-company",
      text: "Court documents in the ESOP litigation state that the Tribune ESOP paid $250 million for shares in April 2007 at a price of $28 per share that plaintiffs alleged was inflated.",
      notes: "Figure comes from pleadings reported by Courthouse News; allegations, not findings.",
      sources: [
        { source: "courthousenews-tribune-esop", excerpt: "The ESOP paid $250 million for shares in April 2007, at an allegedly inflated $28 per share, according to court documents." },
      ],
    },
    {
      slug: "tribune-zell-315m-personal", category: "capital_structure", eventDate: "2007-12-01", eventDatePrecision: "month", status: "unverified", institution: "tribune-company",
      text: "Zell is quoted in a court-filing exhibit as saying he 'put $315 million behind that debt' in the Tribune transaction. The amount and the instrument (reported elsewhere as subordinated notes and warrants) have not been confirmed from a filing in this corpus.",
      notes: "Self-attributed figure. Needs the Tribune 8-K/Schedule 13D or the bankruptcy examiner's report before upgrading.",
      sources: [
        { source: "courthousenews-tribune-esop", excerpt: "Zell wrote that 'I put $315 million behind that debt.'" },
      ],
    },
    {
      slug: "tribune-bankruptcy-dec-2008", category: "failures", eventDate: "2008-12-01", eventDatePrecision: "month", status: "supported_secondary", institution: "tribune-company",
      text: "Tribune Company filed for Chapter 11 bankruptcy protection in December 2008, roughly a year after the buyout closed.",
      sources: [
        { source: "courthousenews-tribune-esop", excerpt: "…filed for Chapter 11 bankruptcy protection in December 2008." },
        { source: "britannica-money-zell" },
      ],
    },
    {
      slug: "tribune-esop-settlement-32m", category: "litigation", status: "supported_secondary", institution: "greatbanc-trust",
      text: "Employees sued over the buyout; a $32 million settlement was later reached with the ESOP trustee, GreatBanc Trust.",
      sources: [
        { source: "planadviser-esop-settlement" },
        { source: "courthousenews-tribune-esop" },
      ],
    },
    {
      slug: "equity-international-1999", category: "portfolio", eventDate: "1999-01-01", eventDatePrecision: "year", status: "supported_secondary", institution: "equity-international",
      text: "Zell and Gary Garrabrant founded Equity International in 1999 to invest in property-related operating companies in emerging markets, notably Mexico (Homex) and Brazil (Gafisa); its first fund raised about $370 million.",
      sources: [
        { source: "columbia-chazen-equity-international", excerpt: "…founded Equity International in 1999… went on to invest in 17 real estate-related companies in emerging markets." },
        { source: "pere-equity-international-speedboat", excerpt: "Its first fund raised $370 million…" },
      ],
    },
    {
      slug: "els-founder", category: "portfolio", status: "supported_secondary", institution: "equity-lifestyle-properties",
      text: "Zell founded Equity LifeStyle Properties, a manufactured-home community and resort REIT, and was its chairman at his death.",
      notes: "The IPO date of its predecessor (Manufactured Home Communities) was not confirmed in this research pass and is deliberately omitted.",
      sources: [
        { source: "rebusiness-zell-obituary-2023", excerpt: "Zell was also the founder of Equity LifeStyle Properties (ELS), a manufactured home community and resort REIT." },
        { source: "wharton-magazine-zell-obituary-2023", excerpt: "…chairman of Equity Group Investments, Equity LifeStyle Properties, Equity Residential, and Equity Commonwealth at the time of his passing." },
      ],
    },
    {
      slug: "zell-memoir-2017", category: "strategy", eventDate: "2017-05-09", status: "verified_primary",
      text: "Zell's memoir 'Am I Being Too Subtle? Straight Talk from a Business Rebel' was published by Portfolio (Penguin) on May 9, 2017 (ISBN 9781591848233).",
      sources: [
        { source: "zell-memoir-catalog-2017", locator: "Catalogue record" },
      ],
    },
    {
      slug: "zell-died-2023-05-18", category: "origins", eventDate: "2023-05-18", status: "verified_primary",
      text: "Zell died on May 18, 2023, aged 81. He was chairman of Equity Group Investments, Equity Residential, Equity LifeStyle Properties and Equity Commonwealth at the time of his death.",
      sources: [
        { source: "eqr-press-release-2023", excerpt: "Equity Residential mourns the death of founder and chairman Samuel Zell." },
        { source: "wharton-magazine-zell-obituary-2023", excerpt: "Sam Zell, 81, died at home on May 18 due to complications from illness." },
      ],
    },
    {
      slug: "zell-wharton-endowment-1998", category: "networks", eventDate: "1998-01-01", eventDatePrecision: "year", status: "supported_secondary",
      text: "Wharton's Samuel Zell and Robert Lurie Real Estate Center, established in 1983, was named for Zell's permanent endowment in 1998.",
      sources: [
        { source: "wharton-magazine-zell-obituary-2023", excerpt: "…established in 1983, was named in recognition of its permanent endowment by him in 1998." },
      ],
    },
    {
      slug: "zell-nareit-chair", category: "networks", status: "supported_secondary",
      text: "Zell served as chair of Nareit, the U.S. REIT industry association.",
      sources: [
        { source: "nareit-zell-obituary-2023", locator: "Headline" },
      ],
    },
  ],

  sections: [
    {
      division: 1, title: "Origins and initial advantages", confidence: "supported_secondary",
      body: `Zell was born in Chicago in 1941 to parents who had left Poland shortly before the German invasion [[claim:zell-born-chicago-1941]]. The family story matters for the dossier because it frames the trait that most sources agree on: an unusual tolerance for being contrarian. Whether that trait was inherited, taught or simply reported after the fact, we cannot say from the record.

The documented structural advantage is more prosaic. Zell went through the University of Michigan and its law school, graduating with a J.D. in 1966 [[claim:zell-michigan-jd-1966]], and while still a student he and Robert Lurie were already managing apartment buildings in Ann Arbor [[claim:zell-lurie-student-apartments]]. The first advantage, then, was not capital. It was operating knowledge of a cash-flowing asset class acquired before he had a career, plus a partner who stayed with him for more than twenty years [[claim:lurie-partner-died-1990]].

What the record does not tell us: how much money the student business made, who financed the first buildings, and whether any family capital was involved. Those are open research questions, not facts to be filled in.`,
    },
    {
      division: 2, title: "Wealth before real estate", confidence: "supported_secondary",
      body: `There is no "before". Unlike Carnegie or Rockefeller, who arrived at property with industrial fortunes already made, Zell's wealth begins inside real estate and only later migrates into corporate distressed debt and operating companies.

The chronology is contested at its very first step. Equity Group Investments is dated to 1968 by the firm itself and to 1964 by Nareit [[claim:egi-founding-year]]. The platform records 1968 as the working date because it is the firm's own account, but flags the claim as contested until a formation document is located. The 1996 Equity Residential annual report gives the first unambiguous primary anchor: Zell-controlled entities had been in the multifamily business since 1969 [[claim:zell-multifamily-since-1969]].

Analytical interpretation: the law degree was never used as a lawyer's credential. It functioned as transactional literacy, which later shows up in the comfort with bankruptcy process, creditor claims and complex structures.`,
    },
    {
      division: 3, title: "Market selection and economic timing", confidence: "supported_secondary",
      body: `Zell's timing thesis is unusually well documented because he wrote it down himself. The 1976 essay "The Grave Dancer" lays out a method for buying properties whose owners or lenders had been crushed by the mid-1970s recession and high interest rates [[claim:grave-dancer-essay-1976]]. The essay's own warning, that there is a fine line between the dancer and the danced upon, is the clearest statement of his risk philosophy on the record.

The same pattern repeats at larger scale. In 1990, as the savings-and-loan collapse and the junk-bond bust flooded the market with impaired corporate paper, he raised the roughly $1 billion Zell/Chilmark Fund [[claim:zell-chilmark-fund-1990]]. Its 1991 purchase of bonds and vendor claims against Carter Hawley Hale [[claim:carter-hawley-hale-1991]] shows the method: buy the claims, not the equity, and let the restructuring deliver control.

The 2007 sale of Equity Office (Division 6 and the linked transaction) is the mirror image: exit when buyers are paying for scarcity rather than cash flow. Interpretation, not documentation: the record supports the view that he was a cycle investor first and a property investor second.`,
    },
    {
      division: 4, title: "Initial acquisitions", confidence: "supported_secondary",
      body: `The early acquisition record is thin in verifiable detail. We know the Ann Arbor apartment business existed [[claim:zell-lurie-student-apartments]] and that Zell-controlled entities were buying multifamily from 1969 [[claim:zell-multifamily-since-1969]]. We do not have purchase prices, lender names or loan terms for any specific 1970s property, and the platform will not invent them.

The first well-documented acquisitions are therefore corporate rather than property deals: the Carter Hawley Hale claims in 1991 [[claim:carter-hawley-hale-1991]], and the Schwinn purchase out of bankruptcy, which is reported by a single secondary history and is recorded here as unverified [[claim:schwinn-1993-1997]].

Research gap: the 1970s property portfolio. A primary-source pass through Cook County and Michigan property records, and through the Grave Dancer essay's own worked example, is the next step before this division can be upgraded.`,
    },
    {
      division: 5, title: "Financing and capital providers", confidence: "verified_primary",
      body: `This is the division where the evidence is strongest, because the capital events are public-market events with SEC filings behind them.

Equity Residential was organised in March 1993 and began operations on August 18, 1993 with an IPO of 13,225,000 common shares [[claim:eqr-ipo-august-1993]]. It was built expressly to carry on the business of the Zell-controlled multifamily entities, which means the IPO was a recapitalisation of an existing private portfolio into permanent public equity, not a start-up.

Equity Office followed on July 11, 1997, selling 28.75 million shares at $21 and using part of the proceeds to repay about $678 million of debt [[claim:eop-ipo-july-1997]]. The use of proceeds is the tell: public equity replaced private-market debt, lowering the cost of capital and lengthening its maturity.

Before the REIT era the capital provider of record was the fund investor. The Zell/Chilmark Fund's roughly $1 billion [[claim:zell-chilmark-fund-1990]] came from institutional limited partners, whose identities are not in this corpus. Lender names for the private-era property deals are likewise unknown.`,
    },
    {
      division: 6, title: "Negotiation and transaction execution", confidence: "verified_primary",
      body: `The Equity Office sale is the case study. In February 2007 the board amended its agreement with Blackstone affiliates to $55.50 a share in cash, about $39 billion including debt [[claim:eop-amended-merger-55-50]], after a Vornado-led consortium had put a $56 headline on the table and then withdrawn it hours before the vote [[claim:eop-vornado-competing-bid]]. Shareholders approved with more than 92% of votes cast [[claim:eop-shareholder-approval-2007]] and the merger took effect on February 9, 2007 [[claim:eop-merger-effective-2007-02-09]].

Two execution lessons are documented rather than inferred. First, certainty was priced: a lower all-cash number from a buyer who could close beat a higher, partly stock, non-binding number. Second, the competitive process was run through public filings and amended agreements, which is why we can reconstruct it at all.

The full reconstruction, including the sources-and-uses view and what remains unknown about Blackstone's acquisition financing, lives in the linked transaction record.`,
    },
    {
      division: 7, title: "Institutional and personal networks", confidence: "supported_secondary",
      body: `The network that the record supports is small and durable rather than wide. Robert Lurie was partner from the beginning until his death in 1990 [[claim:lurie-partner-died-1990]]. Gary Garrabrant co-founded Equity International with Zell in 1999 [[claim:equity-international-1999]]. Chilmark Partners was the co-sponsor of the 1990 fund [[claim:zell-chilmark-fund-1990]].

Institutional standing came through the REIT industry: Zell chaired Nareit [[claim:zell-nareit-chair]] and endowed the Wharton real estate centre that carries his and Lurie's names [[claim:zell-wharton-endowment-1998]].

What is missing from this corpus, and matters for a capital-network map, is the lender side: which banks financed the private-era property purchases and who provided Blackstone's acquisition debt in 2007. These are recorded as unknown nodes rather than guessed.`,
    },
    {
      division: 8, title: "Value creation mechanisms", confidence: "supported_secondary",
      body: `Three mechanisms are visible in the evidence.

Distressed entry. Buying property or claims when forced sellers set the price (Divisions 3 and 4). The 1976 essay is explicit that the edge is in restructuring the capital, not in operating brilliance [[claim:grave-dancer-essay-1976]].

Control through claims. The Carter Hawley Hale position shows value created by owning the debt that would be converted into control in a restructuring [[claim:carter-hawley-hale-1991]], rather than paying for equity up front.

Recapitalisation into public markets. The 1993 and 1997 IPOs converted private portfolios into permanent, lower-cost capital [[claim:eqr-ipo-august-1993]] [[claim:eop-ipo-july-1997]], and the 2007 sale captured the premium that private buyers were paying for scale at the top of the cycle [[claim:eop-amended-merger-55-50]].

Interpretation: none of these mechanisms depends on property appreciation. They depend on the gap between what capital markets pay and what forced sellers accept.`,
    },
    {
      division: 9, title: "Portfolio expansion", confidence: "supported_secondary",
      body: `Expansion ran along asset classes and then across borders. Multifamily became Equity Residential [[claim:eqr-ipo-august-1993]]; office became Equity Office, the largest listed office landlord by 2007 [[claim:eop-largest-office-landlord]]; manufactured-housing communities became Equity LifeStyle Properties [[claim:els-founder]]; and in 1999 Equity International took the operating-company model into Mexico and Brazil [[claim:equity-international-1999]].

The expansion pattern is worth noting for a modern reader: each platform was a separate public or fund vehicle with its own capital, rather than one balance sheet. That kept each asset class's leverage ring-fenced.

Holdings figures (building counts, square footage, enterprise values) at specific dates are not yet loaded in this corpus beyond the IPO and sale events, and are a priority for the next research pass.`,
    },
    {
      division: 10, title: "Risk management and wealth preservation", confidence: "supported_secondary",
      body: `The best-documented act of risk management is the sale of Equity Office in February 2007 [[claim:eop-merger-effective-2007-02-09]]. Whether the timing was foresight or luck is debated; what is not debatable is the outcome for the counterparties. Blackstone resold about $27 billion of the portfolio within five months [[claim:blackstone-resales-27b-2007]], and one of the buyers, Harry Macklowe, lost seven of the towers when he could not refinance [[claim:macklowe-lost-towers-2008]].

Preservation also shows up structurally: separate vehicles per asset class (Division 9), and a preference for owning claims rather than equity in distressed situations (Division 8).

The caveat is Division 11. The same year he sold the office portfolio at the top, he bought a newspaper company with roughly $12 billion of borrowed money.`,
    },
    {
      division: 11, title: "Failures, bankruptcies, litigation and strategic reversals", confidence: "supported_secondary",
      body: `Tribune Company is the central failure. In 2007 Zell led an approximately $8.2 billion leveraged buyout that took the company private through an employee stock ownership plan, with the company borrowing about $12 billion to retire its public shares [[claim:tribune-lbo-2007]]. The ESOP itself paid $250 million for shares at $28 each, a price plaintiffs later alleged was inflated [[claim:tribune-esop-250m-2007]]. Zell's own capital is quoted in a court exhibit at $315 million, a figure the platform records as unverified because it rests on his own statement [[claim:tribune-zell-315m-personal]].

The company filed for Chapter 11 in December 2008, about a year after closing [[claim:tribune-bankruptcy-dec-2008]]. Litigation followed; a $32 million settlement was reached with the ESOP trustee [[claim:tribune-esop-settlement-32m]].

The structure deserves study precisely because it inverted his own rules: maximum leverage against a declining-cash-flow business, bought at the top of the credit cycle, with employees' retirement plan as the equity holder. The reasoning behind it is addressed in his memoir [[claim:zell-memoir-2017]], which this corpus cites only by reference.`,
    },
    {
      division: 12, title: "Modern strategic applications", confidence: "unverified",
      body: `What transfers, stated as hypotheses for a U.S. investor today rather than as documented history:

1. Buy the claim, not the building, when the capital structure is the problem. Non-performing loans and discounted payoffs are the modern form of the Carter Hawley Hale trade [[claim:carter-hawley-hale-1991]].

2. Match the vehicle to the asset class. Separate entities with separate lenders limit contagion, as the Equity platforms did [[claim:eqr-ipo-august-1993]] [[claim:eop-ipo-july-1997]].

3. Sell certainty when buyers are paying for scarcity. The 2007 sale was executed as an all-cash, high-certainty deal into a market that was paying for size [[claim:eop-amended-merger-55-50]].

4. Leverage discipline does not survive a change of asset class. Tribune [[claim:tribune-lbo-2007]] is the control case for every rule above.

The Capital Architecture Lab (Phase 2) will attach an explicitly hypothetical distressed multifamily model to this dossier. It will use fictional entities and labelled assumptions so it cannot be confused with the historical record.`,
    },
  ],

  events: [
    { date: "1941-09-01", precision: "month", title: "Born in Chicago", description: "Son of Jewish immigrants who left Poland in 1939.", category: "life", claim: "zell-born-chicago-1941" },
    { date: "1966-01-01", precision: "year", title: "J.D., University of Michigan Law School", category: "life", claim: "zell-michigan-jd-1966" },
    { date: "1968-01-01", precision: "year", title: "Equity Group Investments founded (date contested)", description: "1968 per the firm; 1964 per Nareit.", category: "institution", claim: "egi-founding-year" },
    { date: "1969-01-01", precision: "year", title: "Zell-controlled entities active in multifamily", category: "acquisition", claim: "zell-multifamily-since-1969" },
    { date: "1976-01-01", precision: "year", title: "Publishes 'The Grave Dancer'", description: "A method for buying and restructuring distressed property in the mid-1970s downturn.", category: "strategy", claim: "grave-dancer-essay-1976" },
    { date: "1990-01-01", precision: "year", title: "Robert Lurie dies; Zell/Chilmark Fund formed", description: "Roughly $1 billion raised for distressed corporate investing.", category: "financing", claim: "zell-chilmark-fund-1990" },
    { date: "1991-01-01", precision: "year", title: "Carter Hawley Hale claims purchase", category: "acquisition", claim: "carter-hawley-hale-1991" },
    { date: "1993-08-18", title: "Equity Residential IPO", description: "13,225,000 common shares; operations commence.", category: "financing", claim: "eqr-ipo-august-1993" },
    { date: "1997-07-11", title: "Equity Office Properties Trust IPO", description: "28.75 million shares at $21.", category: "financing", claim: "eop-ipo-july-1997" },
    { date: "1999-01-01", precision: "year", title: "Equity International founded", category: "institution", claim: "equity-international-1999" },
    { date: "2007-02-09", title: "Equity Office sold to Blackstone affiliates", description: "$55.50 per share in cash; about $39 billion including debt.", category: "exit", claim: "eop-merger-effective-2007-02-09", transaction: "equity-office-sale-2007" },
    { date: "2007-12-01", precision: "month", title: "Tribune Company taken private via ESOP", description: "Approximately $8.2 billion leveraged buyout.", category: "acquisition", claim: "tribune-lbo-2007" },
    { date: "2008-12-01", precision: "month", title: "Tribune files for Chapter 11", category: "failure", claim: "tribune-bankruptcy-dec-2008" },
    { date: "2017-05-09", title: "Memoir published", description: "'Am I Being Too Subtle?' (Portfolio).", category: "life", claim: "zell-memoir-2017" },
    { date: "2023-05-18", title: "Dies in Chicago, aged 81", category: "life", claim: "zell-died-2023-05-18" },
  ],

  transactions: [
    {
      slug: "equity-office-sale-2007",
      name: "Sale of Equity Office Properties Trust to Blackstone affiliates",
      announcedOn: "2006-11-20",
      closedOn: "2007-02-09",
      datePrecision: "day",
      assetDescription: "The entire share capital of Equity Office Properties Trust, the largest publicly traded U.S. office landlord, together with its portfolio of several hundred office buildings and its existing debt.",
      market: "United States — national office",
      location: "Chicago, Illinois (headquarters); portfolio across major U.S. metros",
      assetClass: "Office",
      headlineValueUsd: 39_000_000_000,
      headlineValueLabel: "≈ $39 billion including debt ($55.50 per share in cash)",
      headlineValueStatus: "documented",
      summary: "Zell's Equity Office agreed to be acquired by affiliates of The Blackstone Group. After a competing proposal led by Vornado Realty Trust, the agreement was amended to $55.50 per share in cash, shareholders approved it, and the merger closed on February 9, 2007. It was reported at the time as the largest leveraged buyout in history.",
      rightsAcquired: "Blackstone affiliates acquired 100% of the common equity (merger consideration of $55.50 per share) and assumed or refinanced the company's existing debt. Equity Office shareholders, including Zell-affiliated holders, received cash and surrendered all ownership. The record in this corpus does not break out Zell's personal or EGI holdings at closing.",
      operatingStrategy: "Documented: Blackstone began reselling individual assets and regional portfolios almost immediately, selling roughly $27 billion of property within about five months. Interpretation: the buyer's thesis was price arbitrage between the public portfolio value and the sum of private single-asset values, not long-term ownership.",
      subsequentEvents: "Eight Manhattan buildings were sold to Harry Macklowe's affiliates for about $7 billion and the Washington, D.C. portfolio to Beacon Capital Partners for about $6.5 billion (2007). Macklowe later lost seven of the towers when short-term financing could not be refinanced (2008). Blackstone continued to sell remaining assets over the following decade.",
      exitOrStatus: "Closed. For the seller (Equity Office shareholders) the exit was complete on February 9, 2007. For the buyer, Bisnow (citing the WSJ) reports total portfolio sales of about $46 billion over subsequent years.",
      verifiedOutcome: "Verified: $55.50 cash per share, merger effective February 9, 2007, more than 92% of votes cast in favour. Reported but not documented from filings: the $22 billion equity / $17 billion debt split, Blackstone's roughly $3.5 billion equity contribution and roughly $7 billion eventual profit.",
      openQuestions: "Who provided Blackstone's acquisition financing and on what terms? What was the exact assumed-debt figure in the merger agreement? What was the Zell-affiliated ownership percentage and cash proceeds at closing? What were the per-building prices in the Macklowe and Beacon resales? None of these are answered by the sources in this corpus.",
      participants: [
        { kind: "investor", slug: "sam-zell", role: "Chairman of the seller (Equity Office Properties Trust)" },
        { kind: "institution", slug: "equity-office-properties-trust", role: "Target / seller" },
        { kind: "institution", slug: "blackstone", role: "Acquirer (through managed funds and affiliates)" },
        { kind: "institution", slug: "vornado-realty-trust", role: "Competing bidder (consortium lead); withdrew" },
        { kind: "institution", slug: "macklowe-properties", role: "Subsequent buyer of eight Manhattan buildings (2007)" },
        { kind: "institution", slug: "beacon-capital-partners", role: "Subsequent buyer of the Washington, D.C. portfolio (2007)" },
      ],
      stack: [
        { side: "use", layer: "Equity purchase", label: "Cash paid to Equity Office common shareholders ($55.50 per share)", amountUsd: 22_000_000_000, amountLabel: "> $22 billion", status: "documented", note: "Per-share price is from the SEC-filed press release; the aggregate is from AP reporting and depends on the share count at closing." },
        { side: "use", layer: "Assumed / refinanced debt", label: "Existing Equity Office indebtedness", amountUsd: 17_000_000_000, amountLabel: "≈ $17 billion", status: "estimate", note: "Wire-service figure; the merger agreement's exact debt schedule is not in this corpus." },
        { side: "source", layer: "Sponsor equity", label: "Blackstone real estate fund equity", amountUsd: 3_500_000_000, amountLabel: "≈ $3.5 billion (reported)", provider: "blackstone", status: "estimate", note: "Bisnow citing the WSJ. Not confirmed from a Blackstone filing." },
        { side: "source", layer: "Acquisition debt", label: "New acquisition financing arranged by the buyer", status: "unknown", note: "Amount, structure and lending syndicate are not documented in this corpus. Do not model without labelling the inputs as hypothetical." },
        { side: "source", layer: "Assumed debt", label: "Existing property-level and corporate debt carried over", amountLabel: "≈ $17 billion", status: "estimate", note: "Mirrors the 'use' line; treatment (assumed vs. refinanced) not confirmed." },
      ],
      events: [
        { date: "2006-11-20", title: "Initial Blackstone agreement announced", description: "Original agreed price was lower than the final $55.50; the original per-share figure is not loaded in this corpus and is left blank rather than estimated.", category: "negotiation" },
        { date: "2007-02-01", precision: "month", title: "Vornado-led consortium proposal at a stated $56 per share", category: "negotiation", claim: "eop-vornado-competing-bid" },
        { date: "2007-02-01", precision: "month", title: "Merger agreement amended to $55.50 cash per share", category: "negotiation", claim: "eop-amended-merger-55-50" },
        { date: "2007-02-07", title: "Shareholders approve (> 92% of votes cast)", category: "approval", claim: "eop-shareholder-approval-2007" },
        { date: "2007-02-09", title: "Merger effective", category: "closing", claim: "eop-merger-effective-2007-02-09" },
        { date: "2007-04-01", precision: "month", title: "D.C. portfolio sold to Beacon Capital (~$6.5 billion)", category: "resale", claim: "blackstone-resales-27b-2007" },
        { date: "2007-07-01", precision: "month", title: "≈ $27 billion of assets resold within five months", category: "resale", claim: "blackstone-resales-27b-2007" },
        { date: "2008-06-01", precision: "year", title: "Macklowe loses seven towers on refinancing failure", category: "aftermath", claim: "macklowe-lost-towers-2008" },
      ],
    },
  ],

  relationships: [
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "institution", slug: "equity-group-investments" }, relationship: "co_founded", startYear: 1968, description: "Founding year contested (1964/1968).", claim: "egi-founding-year" },
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "institution", slug: "equity-residential" }, relationship: "co_founded", startYear: 1993, claim: "eqr-ipo-august-1993" },
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "institution", slug: "equity-office-properties-trust" }, relationship: "co_founded", startYear: 1997, claim: "eop-ipo-july-1997" },
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "institution", slug: "equity-lifestyle-properties" }, relationship: "co_founded", claim: "els-founder" },
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "institution", slug: "zell-chilmark-fund" }, relationship: "co_founded", startYear: 1990, claim: "zell-chilmark-fund-1990" },
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "institution", slug: "equity-international" }, relationship: "co_founded", startYear: 1999, claim: "equity-international-1999" },
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "institution", slug: "tribune-company" }, relationship: "acquired", startYear: 2007, description: "Leveraged buyout via ESOP structure.", claim: "tribune-lbo-2007" },
    { from: { kind: "investor", slug: "sam-zell" }, to: { kind: "transaction", slug: "equity-office-sale-2007" }, relationship: "sold", startYear: 2007, claim: "eop-merger-effective-2007-02-09" },
    { from: { kind: "institution", slug: "blackstone" }, to: { kind: "transaction", slug: "equity-office-sale-2007" }, relationship: "acquired", startYear: 2007, claim: "eop-merger-effective-2007-02-09" },
    { from: { kind: "institution", slug: "blackstone" }, to: { kind: "institution", slug: "equity-office-properties-trust" }, relationship: "acquired", startYear: 2007, claim: "eop-merger-effective-2007-02-09" },
    { from: { kind: "institution", slug: "macklowe-properties" }, to: { kind: "institution", slug: "blackstone" }, relationship: "partnered_with", startYear: 2007, description: "Bought eight Manhattan EOP buildings from Blackstone.", claim: "blackstone-resales-27b-2007" },
    { from: { kind: "institution", slug: "beacon-capital-partners" }, to: { kind: "institution", slug: "blackstone" }, relationship: "partnered_with", startYear: 2007, description: "Bought the D.C. portfolio from Blackstone.", claim: "blackstone-resales-27b-2007" },
    { from: { kind: "institution", slug: "zell-chilmark-fund" }, to: { kind: "institution", slug: "equity-group-investments" }, relationship: "partnered_with", startYear: 1990, description: "Co-sponsored with Chilmark Partners.", claim: "zell-chilmark-fund-1990" },
    { from: { kind: "institution", slug: "greatbanc-trust" }, to: { kind: "institution", slug: "tribune-company" }, relationship: "advised", startYear: 2007, description: "ESOP trustee; later settled fiduciary claims for $32 million.", claim: "tribune-esop-settlement-32m" },
  ],

  quotations: [
    { text: "I was dancing on the skeletons of other people's mistakes.", context: "On the origin of the 'Grave Dancer' nickname, describing the mid-1970s distressed-property strategy.", source: "costar-zell-remembered-2023", status: "supported_secondary" },
    { text: "There is often a fine line between the dancer and the danced upon.", context: "Attributed to the 1976 essay 'The Grave Dancer'; a statement of the risk in distressed investing.", source: "zell-grave-dancer-1976", status: "supported_secondary" },
  ],
};
