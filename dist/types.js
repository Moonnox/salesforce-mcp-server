// Type guards
export function isValidQueryArgs(args) {
    return (typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof args.query === "string");
}
export function isValidToolingQueryArgs(args) {
    return (typeof args === "object" &&
        args !== null &&
        "query" in args &&
        typeof args.query === "string");
}
export function isValidDescribeObjectArgs(args) {
    return (typeof args === "object" &&
        args !== null &&
        "objectName" in args &&
        typeof args.objectName === "string" &&
        (args.detailed === undefined || typeof args.detailed === "boolean"));
}
export function isValidMetadataRetrieveArgs(args) {
    return (typeof args === "object" &&
        args !== null &&
        "type" in args &&
        typeof args.type === "string" && // We'll validate against MetadataType in the handler
        "fullNames" in args &&
        Array.isArray(args.fullNames) &&
        args.fullNames.every((name) => typeof name === "string"));
}
// Helper function to validate MetadataType
export function isValidMetadataType(type) {
    return [
        'CustomObject',
        'Flow',
        'FlowDefinition',
        'CustomField',
        'ValidationRule',
        'ApexClass',
        'ApexTrigger',
        'WorkflowRule',
        'Layout'
        // Add more as needed
    ].includes(type);
}
