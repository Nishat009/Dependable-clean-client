// The thanas of the Dhaka Metropolitan Police, plus the upazilas of Dhaka district from bdapis.com.
// The list is cached for a day, so bookings do not wait on the outside API.
const thanaUrl = 'https://bdapis.com/api/v1.2/district/dhaka';
const metroThanas = ['Adabor', 'Badda', 'Banani', 'Bangshal', 'Bhashantek', 'Bhatara', 'Biman Bandar', 'Cantonment', 'Chawkbazar', 'Dakshinkhan', 'Darus Salam', 'Demra', 'Dhanmondi', 'Gendaria', 'Gulshan', 'Hatirjheel', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Khilgaon', 'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Mugda', 'New Market', 'Pallabi', 'Paltan', 'Ramna', 'Rampura', 'Rupnagar', 'Sabujbagh', 'Shah Ali', 'Shahbagh', 'Shahjahanpur', 'Sher-e-Bangla Nagar', 'Shyampur', 'Sutrapur', 'Tejgaon', 'Tejgaon Industrial Area', 'Turag', 'Uttara East', 'Uttara West', 'Uttarkhan', 'Vatara', 'Wari'];
const fallbackUpazilas = ['Dhamrai', 'Dohar', 'Keraniganj', 'Nawabganj', 'Savar'];

// Tests pass fetchUpazilas: null, so they never call the outside API.
function createThanaReader({ fetchUpazilas = process.env.NODE_ENV === 'test' ? null : fetch } = {}) {
  let cache = { list: null, until: 0 };
  return async function readDhakaThanas() {
    if (cache.list && cache.until > Date.now()) return cache.list;
    let upazilas = fallbackUpazilas;
    try {
      const response = fetchUpazilas && await fetchUpazilas(thanaUrl, { signal: AbortSignal.timeout(4000) });
      const rows = response?.ok ? (await response.json()).data : null;
      const found = Array.isArray(rows) ? rows.flatMap((row) => row.upazillas || row.upazilas || []).filter((item) => typeof item === 'string') : [];
      if (found.length) upazilas = found;
    } catch {
      // Keep the built-in upazilas and ask the API again after the short cache below.
    }
    const list = [...new Set([...metroThanas, ...upazilas])].sort((a, b) => a.localeCompare(b));
    cache = { list, until: Date.now() + (upazilas === fallbackUpazilas ? 5 : 24 * 60) * 60 * 1000 };
    return list;
  };
}

module.exports = { createThanaReader, metroThanas };
