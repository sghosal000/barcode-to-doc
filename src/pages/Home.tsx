import React, { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library'
import Papa from 'papaparse'

import { FileType } from '../types/filesType'
import { generateUniqueId } from '../utils/utils'

const LS_FILESNAME = 'fileList'
interface CsvData {
  fileName: string;
  data: string[][];
}


const Home: React.FC = () => {
  const webcamRef = useRef<Webcam>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const searchFieldRef = useRef<HTMLInputElement>(null)

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | null>(null)
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [barcode, setBarcode] = useState<string>("")

  const [dragActive, setDragActive] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [csvData, setCsvData] = useState<CsvData>({ fileName: '', data: [] })
  const [newField, setNewField] = useState('')
  const [newFieldAdded, setNewFieldAdded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRow, setSelectedRow] = useState(-1)

  const [fileHistory, setFileHistory] = useState<FileType[]>([])

  const [errMessage, setErrMessage] = useState('')

  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter((device) => device.kind === "videoinput")

        setVideoDevices(cameras)
        if (cameras.length > 0) {
          setSelectedDevice(cameras[1])
        }
      } catch (error) {
        console.error("Error getting video devices: ", error)
        setErrMessage('Please allow camera access to scan Barcode...')
      }
    }

    getVideoDevices()
  }, [])

  const startScanning = () => {
    if (selectedDevice && !codeReaderRef.current) {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      setIsScanning(true)
      setBarcode('')
      console.log('Scanning...');
      codeReader.decodeFromVideoDevice(selectedDevice.deviceId, webcamRef.current?.video!, (result: Result | null, err: any) => {
        if (result) {
          setBarcode(result.getText())
          stopScanning()
          searchFieldRef.current?.focus()
          console.log("Scanned Barcode: ", result.getText())
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error("Barcode scanning error: ", err)
        }
      })
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      setIsScanning(false)
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
  }

  // this function is for drag and drop file
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  // this function is for select upload file
  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleFileUpload = (file: File) => {
    if (file) {
      Papa.parse(file, {
        complete: (result: any) => {
          const data = result.data as string[][]
          const newFile: FileType = {
            id: generateUniqueId(),
            fileName: file.name,
            type: file.type,
            data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            size: `${(file.size / 1024).toFixed(2)}KB`
          }
          saveFileToLocalstorage(newFile)
          setCsvData({ fileName: file.name, data })
        }
      })
    }
  }

  const filteredData = csvData.data.slice(1).map((row: string[], index: number) => ({ row, orgInd: index })).filter(({ row }) =>
    row.some(cell =>
      cell.toLocaleLowerCase().includes(searchQuery.toLowerCase())))

  const handleAddField = () => {
    if (newField) {
      const newCsvData = csvData.data
      newCsvData[0] = [newField, ...csvData.data[0]]
      for (let i = 1; i < csvData.data.length; i++) {
        newCsvData[i] = ['', ...csvData.data[i]]
      }

      setCsvData({ ...csvData, data: newCsvData })
      setNewFieldAdded(true)
    }
  }

  const handleAddBarcode = () => {
    const newCsvData = csvData
    newCsvData.data[selectedRow + 1] = [barcode, ...csvData.data[selectedRow + 1].slice(1)]
    setCsvData(newCsvData)
    setBarcode('')
    setSelectedRow(-1)
  }

  const handleSaveFile = () => {
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = csvData.fileName ? `${csvData.fileName.split('.').slice(0, -1).join('.')}_barcoded.csv` : 'file_barcoded.csv';
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // This section for handling localstorage
  const getLocalstorageFile = () => JSON.parse(localStorage.getItem(LS_FILESNAME) || '[]')
  const setLocalstorageFile = (files: FileType[]) => localStorage.setItem(LS_FILESNAME, JSON.stringify(files))
  const saveFiles = (files: FileType[]) => {
    setLocalstorageFile(files)
    setFileHistory(files)
  }

  const loadFilesFromLocalstorage = () => {
    const existingFIles = getLocalstorageFile()
    setFileHistory(existingFIles)
  }

  const saveFileToLocalstorage = (file: FileType) => {
    const existingFIles = getLocalstorageFile()
    const updatedFiles = [file, ...existingFIles]

    saveFiles(updatedFiles)
  }

  const removeFileFromLocalstorage = (id: FileType['id']) => {
    const existingFIles = getLocalstorageFile()
    const updatedFiles = existingFIles.filter((file: FileType) => file.id !== id)

    saveFiles(updatedFiles)
  }

  const renameFileInLocalstorage = (id: FileType['id'], name: string) => {
    const existingFIles = getLocalstorageFile()
    const updatedFiles = existingFIles.map((file: FileType) =>
      file.id === id ? { ...file, fileName: name, updatedAt: new Date().toISOString() } : file
    )

    saveFiles(updatedFiles)
  }

  const updateFileDataInLocalstorage = (id: FileType['id'], file: FileType) => {
    const existingFIles = getLocalstorageFile()
    const updatedFiles = existingFIles.map((file: FileType) =>
      file.id === id ? { ...file, data: file, updatedAt: new Date().toISOString() } : file
    )

    saveFiles(updatedFiles)
  }

  useEffect(() => {
    loadFilesFromLocalstorage()
  }, [])

  useEffect(() => {
    if (csvData.fileName && csvData.data.length !== 0) setFileUploaded(true)
    else setFileUploaded(false)
  }, [csvData])


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (event.code === "Space" && !isInputField) {
        event.preventDefault()
        startScanning()
      } else if (event.code === 's') {
        event.preventDefault()
        stopScanning()
      } else if (event.code === 'Enter' && newField && barcode && selectedRow !== -1) {
        handleAddBarcode()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [newField, barcode, selectedRow])

  return (
    <div className='w-full min-h-dvh p-10 flex justify-around bg-background text-txt'>
      <div className="scanner w-4/12 h-fit p-10 rounded-lg shadow-lg flex flex-col gap-2 items-center bg-base">
        <select
          value={selectedDevice?.deviceId || ""}
          onChange={e => setSelectedDevice(videoDevices.find(camera => camera.deviceId === e.target.value) || null)}
          className='cam-select w-full p-2 border border-base-2 rounded-lg shadow-lg bg-base-2'
        >
          <option value="">Select a camera</option>
          {videoDevices.map(camera =>
            <option key={camera.deviceId} value={camera.deviceId}>{camera.label || `Camera ${camera.deviceId}`}</option>
          )}
        </select>
        <div className='w-full'>
          {
            !isScanning ?
              <div className='w-full flex justify-between'>
                <p>Press Space bar to start Scanning...</p>
                <button className='button' onClick={startScanning}>Scan</button>
              </div>
              : <div className='w-full flex justify-between'>
                <p>Scanning...</p>
                <button
                  onClick={stopScanning}
                  className='button'
                >Stop</button>
              </div>
          }
        </div>
        {isScanning &&
          <Webcam
            audio={false}
            ref={webcamRef}
            videoConstraints={{ deviceId: selectedDevice?.deviceId }}
            className='w-fit rounded-lg'
          />
        }
        <p className='w-full'>Scanned Barcode: {barcode}</p>
      </div>

      <div className="data-section w-7/12 min-h-full p-6 rounded-lg flex flex-col gap-2 shadow-lg bg-base">
        <div className="input-data">
          {
            !fileUploaded ?

              <div
                className="flex items-center justify-center w-full"
                onDragOver={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <label
                  htmlFor="dropzone-file"
                  className={`w-full h-64 flex items-center justify-center border-2 border-base-3 hover:border-base-4 ${dragActive ? 'border-sky-600' : ''} border-dashed rounded-lg cursor-pointer bg-base-2 hover:bg-base-3`}
                >
                  <div className="flex flex-col items-center justify-center gap-2 px-5">
                    <p className="text-sm text-txt"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-txt-depressed">file type: csv</p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    accept='.csv'
                    className="hidden"
                    onChange={handleFileUploadChange}
                  />
                </label>
              </div>

              : <div className='w-full flex gap-1 items-center border-b-2 border-base-2 pb-1'>
                <img src="https://www.svgrepo.com/show/458680/file-dock.svg" alt="file" className='h-4 invert' />
                <span>File: <span className='text-txt-depressed'>{csvData.fileName}</span></span>
              </div>
          }
        </div>
        {
          fileUploaded &&
          <div className='flex flex-col gap-4'>
            <div className='table-header w-full flex justify-between items-end'>
              {
                newFieldAdded ?
                  <p>Barcode field: <span className='text-txt-depressed'>{newField}</span></p>
                  : <div className='new-field w-fit pl-2 flex gap-4 rounded-lg bg-base-2'>
                    <input
                      type="text"
                      placeholder='Barcode field name...'
                      value={newField}
                      onChange={(e) => setNewField(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newField) handleAddField()
                      }}
                      className='w-1/3 border-b border-base-2 p-1 pb-0 bg-transparent focus:ring-0 '
                    />
                    <button
                      className='button disabled:cursor-not-allowed'
                      disabled={!newField}
                      onClick={handleAddField}
                    >Add</button>
                  </div>
              }
              <div className='search-field h-8 w-fit p-2 inline-flex gap-2 items-center bg-base-2 rounded-lg'>
                {/* <SearchIcon className={'h-full stroke-2 stroke-txt-depressed'} /> */}
                <img src="https://www.svgrepo.com/show/532552/search-alt-2.svg" alt="search" className='h-full invert' />
                <input
                  type="text"
                  ref={searchFieldRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search in table...'
                  className='appearance-none bg-transparent border-none focus:ring-0 text-sm text-txt-depressed'
                />
                <img src="https://www.svgrepo.com/show/444605/cross.svg" alt="cross" className='h-full invert cursor-pointer' onClick={() => setSearchQuery('')} />
              </div>
            </div>
            <div className='max-h-[500px] rounded-lg shadow-lg overflow-y-auto'>
              <table className='w-full p-4 text-center'>
                <thead className='sticky top-0 bg-base-2 shadow-md'>
                  <tr>
                    <th className='px-4 py-2 whitespace-nowrap'>Sno</th>
                    {csvData.data[0].map((data: string, index: number) => (
                      <th key={index} className="px-4 py-2 whitespace-nowrap">{data}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {
                    filteredData.map(({ row, orgInd }, index1: number) => (
                      <tr
                        key={index1}
                        onClick={() => setSelectedRow(orgInd)}
                        className={`border-b border-base-2 text-sm hover:cursor-pointer ${orgInd === selectedRow ? 'bg-base-3 hover:bg-base-3' : 'hover:bg-gradient-to-t hover:from-base-2 hover:to-10% hover:to-base'}`}
                      >
                        <td className='px-4 py-2 whitespace-nowrap'>{orgInd + 1}</td>
                        {row.map((data: string, index2: number) => (
                          <td key={`${index1}-${index2}`} className='w-fit px-4 py-2 whitespace-nowrap'>{data}</td>
                        ))}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <div className='bottom-btns ml-auto flex gap-2'>
              <button
                disabled={!newField || !barcode || selectedRow === -1}
                onClick={handleAddBarcode}
                className='button disabled:cursor-not-allowed'
              >
                Add to the row
              </button>
              <button
                onClick={handleSaveFile}
                disabled={csvData.data.length === 0}
                className='button bg-sky-600'
              >
                Save file
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  )
}

export default Home
