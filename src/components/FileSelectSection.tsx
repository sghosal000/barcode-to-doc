import React, { useState, useEffect } from 'react'
import * as Papa from 'papaparse'

import useData from '../hooks/useData'
import { FileType } from '../types/filesType'
import { generateUniqueId } from '../utils/utils'
import { test_data } from '../../public/data/test_data'

const LS_FILESNAME = 'fileList'


const FileSelectSection = () => {
  const { setCsvData, fileHistory, setFileHistory } = useData()

  const [dragActive, setDragActive] = useState(false)
  const [selctedFile, setselctedFile] = useState('')
  const [errMessage, setErrMessage] = useState('')

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

  const getUniqueFileName = (fname: string) => {
    const baseName = fname.includes('.') ? fname.split('.').slice(0, -1).join('.') : 'file'
    const extension = fname.includes('.') ? fname.split('.').pop() : 'csv'
    const existingFiles = getLocalstorageFile()
    let  uniqueName = fname
    let counter = 1;

    while (existingFiles.some((file: FileType) => file.fileName === uniqueName)){
      uniqueName = `${baseName}_${counter}.${extension}`
      counter++
    }

    return uniqueName;
  }

  const loadTestData = () => {
    const testData: FileType = {
      id: generateUniqueId(),
      fileName: getUniqueFileName('test_data.csv'),
      data: test_data,
      type: 'text/csv',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveFileToLocalstorage(testData)
    setCsvData(testData)
    // not working synchronously so automatic file open won't work by this
    handleOpenFile(testData.id)
  }

  const handleFileUpload = (file: File) => {
    if (file) {
      Papa.parse(file, {
        complete: (result: any) => {
          const data = result.data as string[][]
          const newFile: FileType = {
            id: generateUniqueId(),
            fileName: getUniqueFileName(file.name),
            type: file.type,
            data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            size: `${(file.size / 1024).toFixed(2)}KB`
          }
          saveFileToLocalstorage(newFile)
          setCsvData({ id: newFile.id, fileName: newFile.fileName, data })
        }
      })
    }
  }

  const handleOpenFile = (id: FileType['id']) => {
    const fileToOpen = fileHistory.find(file => file.id === id)
    if (fileToOpen) {
      setCsvData({ id: fileToOpen.id, fileName: fileToOpen.fileName, data: fileToOpen.data })
    } else {
      setErrMessage('Could not open selected file')
    }
  }

  // This section for handling localstorage
  const getLocalstorageFile = () => JSON.parse(localStorage.getItem(LS_FILESNAME) || '[]')
  const setLocalstorageFile = (files: FileType[]) => localStorage.setItem(LS_FILESNAME, JSON.stringify(files))
  const saveFiles = (files: FileType[]) => {
    setLocalstorageFile(files)
    setFileHistory(files)
  }

  const loadFilesFromLocalstorage = () => {
    const existingFiles  = getLocalstorageFile()
    setFileHistory(existingFiles )
  }

  const saveFileToLocalstorage = (file: FileType) => {
    const existingFiles  = getLocalstorageFile()
    const updatedFiles = [file, ...existingFiles ]

    saveFiles(updatedFiles)
  }

  const removeFileFromLocalstorage = (id: FileType['id']) => {
    const existingFiles  = getLocalstorageFile()
    const updatedFiles = existingFiles .filter((file: FileType) => file.id !== id)

    saveFiles(updatedFiles)
  }

  useEffect(() => {
    loadFilesFromLocalstorage()
  }, [])

  useEffect(() => {
    setTimeout(() => {
      setErrMessage('')
    }, 5000);
  }, [errMessage])


  return (
    <div className='w-full h-full flex flex-col'>
      <div
        className="flex items-center justify-center w-full h-2/6 max-h-[200px]"
        onDragOver={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <label
          htmlFor="dropzone-file"
          className={`w-full h-full flex items-center justify-center border-2 border-base-3 hover:border-base-4 ${dragActive ? 'border-sky-600' : ''} border-dashed rounded-lg cursor-pointer bg-base-2 hover:bg-base-3`}
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
      <div className='file-history h-4/6 pb-4'>
        <div className='w-full flex justify-between p-2'>
          <h3>Or select from previously imported files:</h3>
          <p>You can try the &nbsp;
            <span
              onClick={loadTestData}
              className='underline italic font-semibold text-txt-depressed hover:text-txt cursor-pointer'
            >test file</span>
          </p>
        </div>
        {
          fileHistory.length === 0 ?
            <div className='text-txt-depressed'>No files here. Import a file to start modifying.. </div>
            : <div className='w-full h-fit max-h-full rounded-lg shadow-lg bg-base-2/50 flex flex-col'>
              <div className="history-header w-full p-2 rounded-lg rounded-b-none shadow-md flex justify-between bg-base-2 font-semibold text-center">
                <span className='w-5/12'>File Name</span>
                <span className='w-1/12'>Type</span>
                <span className='w-1/12'>Size</span>
                <span className='w-2/12'>Created</span>
                <span className='w-2/12'>Modified</span>
                <span className='w-5'></span>
              </div>
              <div className='history-body w-full overflow-y-auto'>
                {
                  fileHistory.map(file => (
                    <div
                      key={file.id}
                      onClick={() => setselctedFile(file.id)}
                      onDoubleClick={() => handleOpenFile(file.id)}
                      onMouseDown={(e) => e.preventDefault()}
                      className={`history-row w-full p-2 border-t border-base-2 flex justify-between text-sm text-center text-txt-depressed cursor-pointer ${file.id === selctedFile ? 'bg-base-2' : 'hover:bg-base-2/50'}`}
                    >
                      <span className='w-5/12 flex items-center gap-1 text-left'>
                        <img src="https://www.svgrepo.com/show/458680/file-dock.svg" alt="file" className='h-4 invert' />
                        {file.fileName}
                      </span>
                      <span className='w-1/12'>{file.type.split('/')[1]}</span>
                      <span className='w-1/12'>{file.size || 'N/A'}</span>
                      <span className='w-2/12 text-xs'>{new Date(file.createdAt).toLocaleString()}</span>
                      <span className='w-2/12 text-xs'>{new Date(file.updatedAt).toLocaleString()}</span>
                      <span className='w-5'>
                        <img
                          src="https://www.svgrepo.com/show/502609/delete-1.svg"
                          alt="delete"
                          className='w-4 invert'
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFileFromLocalstorage(file.id)
                          }}
                        />
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
        }
      </div>

    </div>
  )
}

export default FileSelectSection