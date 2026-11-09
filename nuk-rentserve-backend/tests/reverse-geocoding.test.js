// Verification test for Karnataka GPS Coordinate & Reverse Geocode Resolver

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (n) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const KARNATAKA_TOWNS = [
  { name: 'Jamkhandi', district: 'Bagalkot', latitude: 16.505, longitude: 75.295, radiusKm: 22, postalCodes: ['587301', '587302', '587330'] },
  { name: 'Mudhol', district: 'Bagalkot', latitude: 16.34, longitude: 75.285, radiusKm: 18, postalCodes: ['587313'] },
  { name: 'Bilgi', district: 'Bagalkot', latitude: 16.345, longitude: 75.618, radiusKm: 16, postalCodes: ['587116'] },
  { name: 'Bagalkot', district: 'Bagalkot', latitude: 16.1853, longitude: 75.6968, radiusKm: 20, postalCodes: ['587101', '587102', '587103'] },
  { name: 'Badami', district: 'Bagalkot', latitude: 15.918, longitude: 75.679, radiusKm: 18, postalCodes: ['587201'] },
  { name: 'Ilkal', district: 'Bagalkot', latitude: 15.962, longitude: 76.13, radiusKm: 16, postalCodes: ['587125'] },
  { name: 'Belagavi', district: 'Belagavi', latitude: 15.8497, longitude: 74.4977, radiusKm: 30, postalCodes: ['590001', '590002', '590003'] },
];

const BELAGAVI_CENTER = { latitude: 15.8497, longitude: 74.4977 };

function resolveKarnatakaLocation(coords, reverseResult) {
  const { latitude, longitude } = coords;
  const rawName = String(reverseResult?.name || '').trim();
  const rawStreet = String(reverseResult?.street || '').trim();
  const rawCity = String(reverseResult?.city || '').trim();
  const rawDistrict = String(reverseResult?.district || '').trim();
  const rawSubregion = String(reverseResult?.subregion || '').trim();
  const postalCode = String(reverseResult?.postalCode || '').trim();

  const distFromBelagavi = haversineDistanceKm(latitude, longitude, BELAGAVI_CENTER.latitude, BELAGAVI_CENTER.longitude);
  const isFarFromBelagavi = distFromBelagavi > 40;
  const isBelagaviString = (s) => /belagavi|belgaum/i.test(s) && (s.toLowerCase().includes('division') || isFarFromBelagavi);

  if (postalCode) {
    const matched = KARNATAKA_TOWNS.find((t) => t.postalCodes.includes(postalCode));
    if (matched) {
      return { town: matched.name, district: matched.district, postalCode };
    }
  }

  const allText = `${rawName} ${rawStreet} ${rawCity} ${rawDistrict} ${rawSubregion}`.toLowerCase();
  for (const town of KARNATAKA_TOWNS) {
    if (town.name === 'Belagavi' && isFarFromBelagavi) {
      continue;
    }
    const tLower = town.name.toLowerCase();
    const alias = town.name === 'Jamkhandi' ? 'jamakhandi' : tLower;
    if (allText.includes(tLower) || allText.includes(alias)) {
      return { town: town.name, district: town.district, postalCode };
    }
  }

  for (const town of KARNATAKA_TOWNS) {
    const dist = haversineDistanceKm(latitude, longitude, town.latitude, town.longitude);
    if (dist <= town.radiusKm) {
      return { town: town.name, district: town.district, postalCode };
    }
  }

  const candidateCity = !isBelagaviString(rawCity) ? rawCity : '';
  const candidateDistrict = !isBelagaviString(rawDistrict) ? rawDistrict : '';
  const detectedTown = candidateCity || candidateDistrict || 'Bagalkot';
  return { town: detectedTown, district: 'Bagalkot', postalCode };
}

describe("Jamkhandi vs Belagavi Geocoding Tests", () => {
  test("Android Geocoder in Jamkhandi returning subregion 'Belagavi' is correctly resolved to Jamkhandi", () => {
    const coords = { latitude: 16.505, longitude: 75.295 }; // Physical Jamkhandi
    const androidGeocoderOutput = {
      name: "Main Bazaar",
      street: "KSRTC Road",
      city: "", // Android Geocoder frequently returns empty city for taluk towns
      subregion: "Belagavi", // British/Revenue Division
      district: "Bagalkot",
      postalCode: "587301",
    };

    const resolved = resolveKarnatakaLocation(coords, androidGeocoderOutput);
    expect(resolved.town).toBe("Jamkhandi");
    expect(resolved.district).toBe("Bagalkot");
    expect(resolved.town).not.toBe("Belagavi");
  });

  test("Physical Jamkhandi coordinates with only Division name still resolves to Jamkhandi", () => {
    const coords = { latitude: 16.51, longitude: 75.29 };
    const androidOutput = {
      city: "",
      subregion: "Belagavi Division",
    };

    const resolved = resolveKarnatakaLocation(coords, androidOutput);
    expect(resolved.town).toBe("Jamkhandi");
    expect(resolved.district).toBe("Bagalkot");
  });

  test("Actual Belagavi city coordinates (15.8497, 74.4977) correctly resolves to Belagavi", () => {
    const coords = { latitude: 15.8497, longitude: 74.4977 };
    const androidOutput = {
      city: "Belagavi",
      subregion: "Belagavi",
      postalCode: "590001",
    };

    const resolved = resolveKarnatakaLocation(coords, androidOutput);
    expect(resolved.town).toBe("Belagavi");
    expect(resolved.district).toBe("Belagavi");
  });

  test("Mudhol coordinates (16.34, 75.285) correctly resolves to Mudhol", () => {
    const coords = { latitude: 16.34, longitude: 75.285 };
    const androidOutput = {
      subregion: "Belagavi Division",
      postalCode: "587313",
    };

    const resolved = resolveKarnatakaLocation(coords, androidOutput);
    expect(resolved.town).toBe("Mudhol");
    expect(resolved.district).toBe("Bagalkot");
  });
});
