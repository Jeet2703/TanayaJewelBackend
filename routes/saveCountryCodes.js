const axios = require('axios');
const fs = require('fs');

// Fetch and save country codes to a JSON file
const saveCountryCodes = async () => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all');
    const countryCodes = response.data.map((country) => ({
      name: country.name.common,
      code: country.idd.root ? `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ''}` : '',
    })).filter((country) => country.code); // Filter out countries without codes

    // Save the data to a file
    fs.writeFileSync('countryCodes.json', JSON.stringify(countryCodes, null, 2));
    console.log('Country codes saved to countryCodes.json');
  } catch (error) {
    console.error('Error fetching and saving country codes:', error);
  }
};

// Call the function to save the data
saveCountryCodes();
