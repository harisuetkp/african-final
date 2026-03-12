import React from 'react';

const COUNTRY_FLAGS = {
  'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭',
  'Kenya': '🇰🇪',
  'South Africa': '🇿🇦',
  'Ethiopia': '🇪🇹',
  'Egypt': '🇪🇬',
  'Morocco': '🇲🇦',
  'Tanzania': '🇹🇿',
  'Uganda': '🇺🇬',
  'Algeria': '🇩🇿',
  'Sudan': '🇸🇩',
  'DR Congo': '🇨🇩',
  'Congo': '🇨🇬',
  'Mozambique': '🇲🇿',
  'Madagascar': '🇲🇬',
  'Cameroon': '🇨🇲',
  'Ivory Coast': '🇨🇮',
  'Angola': '🇦🇴',
  'Niger': '🇳🇪',
  'Mali': '🇲🇱',
  'Burkina Faso': '🇧🇫',
  'Malawi': '🇲🇼',
  'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼',
  'Senegal': '🇸🇳',
  'Chad': '🇹🇩',
  'Somalia': '🇸🇴',
  'Guinea': '🇬🇳',
  'Rwanda': '🇷🇼',
  'Benin': '🇧🇯',
  'Burundi': '🇧🇮',
  'Tunisia': '🇹🇳',
  'Togo': '🇹🇬',
  'Sierra Leone': '🇸🇱',
  'Libya': '🇱🇾',
  'Liberia': '🇱🇷',
  'Mauritania': '🇲🇷',
  'Eritrea': '🇪🇷',
  'Namibia': '🇳🇦',
  'Gambia': '🇬🇲',
  'Botswana': '🇧🇼',
  'Gabon': '🇬🇦',
  'Lesotho': '🇱🇸',
  'Guinea-Bissau': '🇬🇼',
  'Equatorial Guinea': '🇬🇶',
  'Mauritius': '🇲🇺',
  'Eswatini': '🇸🇿',
  'Djibouti': '🇩🇯',
  'Comoros': '🇰🇲',
  'Cape Verde': '🇨🇻',
  'Central African Republic': '🇨🇫',
  'South Sudan': '🇸🇸',
  'Seychelles': '🇸🇨',
  'São Tomé and Príncipe': '🇸🇹',
  // Diaspora countries
  'USA': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'France': '🇫🇷',
  'Canada': '🇨🇦',
  'Germany': '🇩🇪',
  'Brazil': '🇧🇷',
  'Jamaica': '🇯🇲',
  'Haiti': '🇭🇹',
  'Trinidad and Tobago': '🇹🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Portugal': '🇵🇹',
  'Australia': '🇦🇺'
};

export default function CountryFlag({ country, showName = true, size = "default" }) {
  const flag = COUNTRY_FLAGS[country] || '🌍';
  const textSize = size === "small" ? "text-sm" : "text-base";

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span>{flag}</span>
      {showName && <span>{country}</span>}
    </span>
  );
}

export { COUNTRY_FLAGS };