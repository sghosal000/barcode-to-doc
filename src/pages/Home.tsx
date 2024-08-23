import React, { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library'
import Papa from 'papaparse'

const Home: React.FC = () => {
  const webcamRef = useRef<Webcam>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | null>(null)
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [barcode, setBarcode] = useState<string>("")

  const [dragActive, setDragActive] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [fileName, setFileName] = useState('')
  const [newField, setNewField] = useState('')

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
      }
    }

    getVideoDevices()
  }, [])

  const startScanning = () => {
    if (selectedDevice && !codeReaderRef.current) {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      setIsScanning(true)
      console.log('Scanning...');
      codeReader.decodeFromVideoDevice(selectedDevice.deviceId, webcamRef.current?.video!, (result: Result | null, err: any) => {
        if (result) {
          setBarcode(result.getText())
          stopScanning()
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        startScanning()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

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
      setFileName(file.name)
      Papa.parse(file, {
        complete: (result: any) => {
          setCsvData(result.data as string[][])
          setFileUploaded(true)
        }
      })
    }
  }

  const handleAddField = () => {
  }

  return (
    <div className='w-full min-h-dvh p-10 flex justify-around bg-background text-txt'>
      <div className="scanner w-4/12 p-10 rounded-lg shadow-lg flex flex-col gap-2 items-center bg-base">
        <select
          value={selectedDevice?.deviceId || ""}
          onChange={e => setSelectedDevice(videoDevices.find(camera => camera.deviceId === e.target.value) || null)}
          className='cam-select w-full p-2 border border-base-2 rounded-lg shadow-lg bg-base-3'
        >
          <option value="">Select a camera</option>
          {videoDevices.map(camera =>
            <option key={camera.deviceId} value={camera.deviceId}>{camera.label || `Camera ${camera.deviceId}`}</option>
          )}
        </select>
        <div className='w-full p-2 flex'>
          {
            !isScanning ?
              <p>Press Space bar to start Scanning...</p>
              : <>
                <p className='w-2/3'>Scanning...</p>
                <button
                  onClick={stopScanning}
                  className='button'
                >Stop</button>
              </>
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
        <h2>Scanned Barcode:</h2>
        <p>{barcode}</p>
      </div>

      <div className="data-section w-7/12 p-6 rounded-lg flex flex-col gap-4 shadow-lg bg-base">
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

              : <div>
                <p>File: <span className='text-txt-depressed'>{fileName}</span></p>
                <div className='flex gap-4'>
                  <label className='flex gap-4 items-end' >
                    <span>Column name where barcode needs to be added:</span>
                    <input type="text" className='w-1/3 border-b border-base-2 p-1 pb-0 bg-transparent focus:ring-0 ' />
                  </label>
                  <button className='button'>Add</button>
                </div>
              </div>
          }
        </div>
        {
          csvData.length > 0 &&
          <div className='max-h-[600px] rounded-lg shadow-lg overflow-y-auto'>
            <table className='w-full p-4'>
              <thead className='sticky top-0 bg-base-2 shadow-md'>
                <tr>
                  {csvData[0].map((data: string, index: number) => (
                    <th key={index} className="px-4 py-2">{data}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {
                  csvData.slice(1).map((row: string[], index1: number) => (
                    <tr key={index1} className='border-b border-base-2'>
                      {row.map((data: string, index2: number) => (
                        <td key={`${index1}-${index2}`} className='px-4 py-2'>{data}</td>
                      ))}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  )
}

export default Home
