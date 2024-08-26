export interface FileType {
    id: string;
    fileName: string;
    type: string;
    data: string[][];
    createdAt: string;
    updatedAt: string;
    size?: string
}