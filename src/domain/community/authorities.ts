/**
 * AirAware — State & City Pollution Control Authority Resolver
 * Maps Indian cities and states to their official environmental regulatory bodies,
 * with a reliable generic fallback for unmapped or international locations.
 */

export interface PollutionAuthority {
  readonly code: string;
  readonly name: string;
  readonly fullLabel: string;
  readonly reportingPortal: string;
}

const AUTHORITIES_BY_KEY: Record<string, PollutionAuthority> = {
  DELHI: {
    code: 'DPCC',
    name: 'Delhi Pollution Control Committee (DPCC)',
    fullLabel: 'Delhi Pollution Control Committee (DPCC)',
    reportingPortal: 'Green Delhi App & CPCB Sameer',
  },
  UP: {
    code: 'UPPCB',
    name: 'Uttar Pradesh Pollution Control Board (UPPCB)',
    fullLabel: 'Uttar Pradesh Pollution Control Board (UPPCB)',
    reportingPortal: 'UPPCB Portal & CPCB Sameer',
  },
  HARYANA: {
    code: 'HSPCB',
    name: 'Haryana State Pollution Control Board (HSPCB)',
    fullLabel: 'Haryana State Pollution Control Board (HSPCB)',
    reportingPortal: 'HSPCB Portal & CPCB Sameer',
  },
  MAHARASHTRA: {
    code: 'MPCB',
    name: 'Maharashtra Pollution Control Board (MPCB)',
    fullLabel: 'Maharashtra Pollution Control Board (MPCB)',
    reportingPortal: 'MPCB Grievance Portal & CPCB Sameer',
  },
  KARNATAKA: {
    code: 'KSPCB',
    name: 'Karnataka State Pollution Control Board (KSPCB)',
    fullLabel: 'Karnataka State Pollution Control Board (KSPCB)',
    reportingPortal: 'KSPCB Portal & CPCB Sameer',
  },
  WEST_BENGAL: {
    code: 'WBPCB',
    name: 'West Bengal Pollution Control Board (WBPCB)',
    fullLabel: 'West Bengal Pollution Control Board (WBPCB)',
    reportingPortal: 'WBPCB Portal & CPCB Sameer',
  },
  TAMIL_NADU: {
    code: 'TNPCB',
    name: 'Tamil Nadu Pollution Control Board (TNPCB)',
    fullLabel: 'Tamil Nadu Pollution Control Board (TNPCB)',
    reportingPortal: 'TNPCB Portal & CPCB Sameer',
  },
  TELANGANA: {
    code: 'TSPCB',
    name: 'Telangana State Pollution Control Board (TSPCB)',
    fullLabel: 'Telangana State Pollution Control Board (TSPCB)',
    reportingPortal: 'TSPCB Portal & CPCB Sameer',
  },
  GUJARAT: {
    code: 'GPCB',
    name: 'Gujarat Pollution Control Board (GPCB)',
    fullLabel: 'Gujarat Pollution Control Board (GPCB)',
    reportingPortal: 'GPCB Portal & CPCB Sameer',
  },
  RAJASTHAN: {
    code: 'RSPCB',
    name: 'Rajasthan State Pollution Control Board (RSPCB)',
    fullLabel: 'Rajasthan State Pollution Control Board (RSPCB)',
    reportingPortal: 'RSPCB Portal & CPCB Sameer',
  },
  PUNJAB: {
    code: 'PPCB',
    name: 'Punjab Pollution Control Board (PPCB)',
    fullLabel: 'Punjab Pollution Control Board (PPCB)',
    reportingPortal: 'PPCB Portal & CPCB Sameer',
  },
  BIHAR: {
    code: 'BSPCB',
    name: 'Bihar State Pollution Control Board (BSPCB)',
    fullLabel: 'Bihar State Pollution Control Board (BSPCB)',
    reportingPortal: 'BSPCB Portal & CPCB Sameer',
  },
};

export const DEFAULT_AUTHORITY: PollutionAuthority = {
  code: 'SPCB',
  name: 'your State Pollution Control Board, or the CPCB Sameer app',
  fullLabel: 'State Pollution Control Board / CPCB Sameer',
  reportingPortal: 'CPCB Sameer App',
};

/**
 * Resolves the relevant statutory pollution control authority based on city and state/country strings.
 */
export function getPollutionControlAuthority(
  cityName?: string | null,
  regionOrState?: string | null
): PollutionAuthority {
  const query = `${cityName || ''} ${regionOrState || ''}`.toLowerCase();

  if (/delhi|new delhi|ncr\b/i.test(query) && !/noida|gurugram|ghaziabad|faridabad/i.test(query)) {
    return AUTHORITIES_BY_KEY.DELHI;
  }
  if (/uttar pradesh|\bup\b|noida|ghaziabad|lucknow|kanpur|agra|varanasi|meerut/i.test(query)) {
    return AUTHORITIES_BY_KEY.UP;
  }
  if (/haryana|gurugram|gurgaon|faridabad|rohtak|panipat|sonipat/i.test(query)) {
    return AUTHORITIES_BY_KEY.HARYANA;
  }
  if (/maharashtra|mumbai|pune|nagpur|thane|nashik/i.test(query)) {
    return AUTHORITIES_BY_KEY.MAHARASHTRA;
  }
  if (/karnataka|bengaluru|bangalore|mysore|mysuru|mandya|mangalore/i.test(query)) {
    return AUTHORITIES_BY_KEY.KARNATAKA;
  }
  if (/west bengal|kolkata|howrah|durgapur|asansol/i.test(query)) {
    return AUTHORITIES_BY_KEY.WEST_BENGAL;
  }
  if (/tamil nadu|chennai|coimbatore|madurai/i.test(query)) {
    return AUTHORITIES_BY_KEY.TAMIL_NADU;
  }
  if (/telangana|hyderabad|secunderabad|warangal/i.test(query)) {
    return AUTHORITIES_BY_KEY.TELANGANA;
  }
  if (/gujarat|ahmedabad|surat|vadodara|rajkot/i.test(query)) {
    return AUTHORITIES_BY_KEY.GUJARAT;
  }
  if (/rajasthan|jaipur|jodhpur|kota/i.test(query)) {
    return AUTHORITIES_BY_KEY.RAJASTHAN;
  }
  if (/punjab|ludhiana|amritsar|jalandhar/i.test(query)) {
    return AUTHORITIES_BY_KEY.PUNJAB;
  }
  if (/bihar|patna|gaya|muzaffarpur/i.test(query)) {
    return AUTHORITIES_BY_KEY.BIHAR;
  }

  return DEFAULT_AUTHORITY;
}
