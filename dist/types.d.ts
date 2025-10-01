import type { MetadataType } from 'jsforce/api/metadata';
export interface QueryArgs {
    query: string;
}
export interface ToolingQueryArgs {
    query: string;
}
export interface DescribeObjectArgs {
    objectName: string;
    detailed?: boolean;
}
export interface MetadataRetrieveArgs {
    type: MetadataType;
    fullNames: string[];
}
export declare function isValidQueryArgs(args: any): args is QueryArgs;
export declare function isValidToolingQueryArgs(args: any): args is ToolingQueryArgs;
export declare function isValidDescribeObjectArgs(args: any): args is DescribeObjectArgs;
export declare function isValidMetadataRetrieveArgs(args: any): args is MetadataRetrieveArgs;
export declare function isValidMetadataType(type: string): type is MetadataType;
