export interface FormField {
  type: string;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  selector: string;
  context?: string; // Surrounding text/context
  required?: boolean;
}

export interface PageContext {
  title: string;
  url: string;
  formTitle?: string;
  formDescription?: string;
  fields: FormField[];
}

export function extractFields(): FormField[] {
  const fields: FormField[] = [];
  
  // Find all input fields
  const inputs = document.querySelectorAll('input, textarea, select');
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Skip hidden fields, submit buttons, etc.
    if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
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

    // Get surrounding context (parent container text, headings, etc.)
    let context = '';
    const parent = element.closest('div, section, fieldset, form');
    if (parent) {
      // Get heading or description near the field
      const heading = parent.querySelector('h1, h2, h3, h4, h5, h6, .title, .heading');
      if (heading) {
        context += heading.textContent?.trim() + ' ';
      }
      
      // Get description or help text
      const description = parent.querySelector('.description, .help-text, .hint, p');
      if (description && description !== element) {
        context += description.textContent?.trim() + ' ';
      }
    }

    // Check if required
    const required = element.hasAttribute('required') || 
                     element.getAttribute('aria-required') === 'true';

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
      context: context.trim() || undefined,
      required: required || undefined,
    });
  });

  return fields;
}

export function extractPageContext(): PageContext {
  const fields = extractFields();
  
  // Get page title
  const title = document.title || '';
  
  // Get form title/heading
  const form = document.querySelector('form');
  let formTitle = '';
  let formDescription = '';
  
  if (form) {
    const formHeading = form.querySelector('h1, h2, h3, .form-title, .title');
    if (formHeading) {
      formTitle = formHeading.textContent?.trim() || '';
    }
    
    const formDesc = form.querySelector('.form-description, .description, p');
    if (formDesc) {
      formDescription = formDesc.textContent?.trim() || '';
    }
  }

  return {
    title,
    url: window.location.href,
    formTitle: formTitle || undefined,
    formDescription: formDescription || undefined,
    fields,
  };
}

