/** Reject clearly incompatible physical dimensions without guessing a lab's reference ranges. */
export function readingUnitError(name: string, unit: string) {
  if (
    /alkaline[ _-]*phosphatase|\balp\b|cholesterol|glucose|hba1c|haemoglobin|hemoglobin/i.test(
      name,
    ) &&
    /^(?:cm|mm|m|in|inch|inches|ft|feet|kg|g|lb|lbs)$/i.test(unit.trim())
  ) {
    return 'This unit does not match the selected test. Enter the unit printed beside the result on your report.';
  }
  return '';
}
