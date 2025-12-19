export interface FormField {
  type: string;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  selector: string;
}

export function extractFields(): FormField[] {
  const fields: FormField[] = [];
  
  // Find all input fields
  const inputs = document.querySelectorAll('input, textarea, select');
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Skip hidden fields
    if (element.type === 'hidden') {
      return;
    }

    // Get label
    let label = '';
    if (element.id) {
      const labelElement = document.querySelector(`label[for="${element.id}"]`);
      if (labelElement) {
        label = labelElement.textContent?.trim() || '';
      }
    }
    
    // If no label found, try to find parent label
    if (!label) {
      const parentLabel = element.closest('label');
      if (parentLabel) {
        label = parentLabel.textContent?.trim() || '';
      }
    }

    // Get placeholder
    const placeholder = element.getAttribute('placeholder') || '';

    // Determine field type
    let fieldType = element.tagName.toLowerCase();
    if (element instanceof HTMLInputElement) {
      fieldType = element.type || 'text';
    }

    // Generate selector
    let selector = '';
    if (element.id) {
      selector = `#${element.id}`;
    } else if (element.name) {
      selector = `[name="${element.name}"]`;
    } else {
      selector = element.tagName.toLowerCase();
    }

    fields.push({
      type: fieldType,
      name: element.name || undefined,
      id: element.id || undefined,
      label: label || undefined,
      placeholder: placeholder || undefined,
      value: element.value || undefined,
      selector: selector,
    });
  });

  return fields;
}

