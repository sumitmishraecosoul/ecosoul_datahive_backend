const getDistinctColumnValues = (rows) => {
	if (!Array.isArray(rows) || rows.length === 0) {
		return {};
	}

	const distinctValues = {};

	for (const row of rows) {
		if (!row || typeof row !== 'object') continue;

		for (const [columnName, value] of Object.entries(row)) {
		
			if (!distinctValues[columnName]) {
				distinctValues[columnName] = new Set();
			}
			
			if (value !== null && value !== undefined && value !== '') {
				const stringValue = String(value).trim();
				if (stringValue) {
					distinctValues[columnName].add(stringValue);
				}
			}
		}
	}
    
	const result = {};
	for (const [columnName, valueSet] of Object.entries(distinctValues)) {
		result[columnName] = Array.from(valueSet).sort();
	}
	
	return result;
};

export default getDistinctColumnValues;

// Internal helpers (duplicated minimal logic to avoid controller dependency)
function _flattenObject(obj, prefix = '', out = {}) {
	if (!obj || typeof obj !== 'object') return out;
	for (const key of Object.keys(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;
		const val = obj[key];
		if (val && typeof val === 'object' && !Array.isArray(val)) {
			_flattenObject(val, path, out);
		} else {
			out[path] = val;
		}
	}
	return out;
}

function _getValueByPossibleKeys(flatRow, keys) {
	for (const k of keys) {
		if (Object.prototype.hasOwnProperty.call(flatRow, k)) return flatRow[k];
	}
	return undefined;
}

// Generic filtering using a mapping of query keys -> possible column name variants
// mappings example:
// {
//   Invoice_No: ['Invoice #', 'Invoice_#', 'invoice #'],
//   Category_Type: ['Category Type', 'Category_Type'],
//   ...
// }
export function applyFiltersByMappings(rows, query, mappings) {
	if (!Array.isArray(rows) || rows.length === 0) return rows;
	if (!query || typeof query !== 'object' || !mappings || typeof mappings !== 'object') return rows;

	const activeKeys = Object.keys(mappings).filter((qk) => {
		const raw = query[qk];
		if (raw === undefined || raw === null) return false;
		// Handle arrays
		if (Array.isArray(raw)) return raw.length > 0;
		// Handle strings and other types
		return String(raw).trim() !== '';
	});
	if (activeKeys.length === 0) return rows;

	return rows.filter((row) => {
        const flat = _flattenObject(row);
        for (const queryKey of activeKeys) {
            const raw = query[queryKey];
            let allowed = [];
            // Handle arrays directly
            if (Array.isArray(raw)) {
                allowed = raw.map(s => String(s).trim()).filter(Boolean);
            } else if (raw !== undefined && raw !== null) {
                // Handle single values and comma-separated strings
                allowed = String(raw).split(',').map(s => s.trim()).filter(Boolean);
            }
            if (allowed.length === 0) continue;
            const possibleColumns = mappings[queryKey] || [];
            const value = _getValueByPossibleKeys(flat, possibleColumns);
            const valueStr = value !== undefined && value !== null ? String(value).trim() : '';
            if (!allowed.includes(valueStr)) return false;
        }
        return true;
	});
}

