import React, { useState, useEffect, createContext } from 'react'

import { FileType } from '../types/filesType';

interface CsvData {
    id: string;
    fileName: string;
    data: string[][];
}

export interface DataContextType {
    barcode: string;
    setBarcode: React.Dispatch<React.SetStateAction<string>>;
    fileHistory: FileType[];
    setFileHistory: React.Dispatch<React.SetStateAction<FileType[]>>;
    csvData: CsvData;
    setCsvData: React.Dispatch<React.SetStateAction<CsvData>>;
    fileUploaded: boolean;
    setFileUploaded: React.Dispatch<React.SetStateAction<boolean>>;
}

// different of hadling types for context initial value as null.
// One more way is to return an error if no context inside the provider function
const DataContext = createContext<DataContextType>(null!)
// const DataContext = createContext<DataContextType>({} as DataContextType)


export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [barcode, setBarcode] = useState<string>("")
    const [fileHistory, setFileHistory] = useState<FileType[]>([])
    const [csvData, setCsvData] = useState<CsvData>({ id: '', fileName: '', data: [] })
    const [fileUploaded, setFileUploaded] = useState(false)

    useEffect(() => {
        (csvData.fileName && csvData.data.length !== 0) ? setFileUploaded(true) : setFileUploaded(false)
    }, [csvData])

    return (
        <DataContext.Provider value={{
            barcode,
            setBarcode,
            fileHistory,
            setFileHistory,
            csvData,
            setCsvData,
            fileUploaded,
            setFileUploaded
        }}>
            {children}
        </DataContext.Provider>
    )
}

export default DataContext