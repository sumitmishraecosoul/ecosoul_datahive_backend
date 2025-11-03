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

