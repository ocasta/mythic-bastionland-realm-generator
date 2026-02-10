import { serializeRealm, validateRealmData as validateData, deserializeRealm } from "./realmStorage";

/**
 * Sanitizes a realm name for use as a filename
 */
const sanitizeFilename = (name) => {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

export const exportRealm = (realm) => {
  const exportData = serializeRealm(realm);
  const jsonString = JSON.stringify(exportData, null, 2);

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(realm.name || 'realm')}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const importRealm = (file, onSuccess, onError) => {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const importData = JSON.parse(event.target.result);

      if (!validateData(importData)) {
        throw new Error('Invalid realm data structure');
      }

      const realm = deserializeRealm(importData);
      onSuccess(realm);
    } catch (error) {
      onError(`Failed to import realm: ${error.message}`);
    }
  };

  reader.onerror = () => {
    onError('Failed to read file');
  };

  reader.readAsText(file);
};

// Re-export for backwards compatibility
export const validateRealmData = validateData;
export const createRealmFromImportData = deserializeRealm;