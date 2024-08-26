import React, { useState, useEffect } from 'react'
import * as Papa from 'papaparse'

import useData from '../hooks/useData'
import { FileType } from '../types/filesType'

import FileSelectSection from './FileSelectSection'

const LS_FILESNAME = 'fileList'
interface PropTypes {
	searchFieldRef: React.RefObject<HTMLInputElement>
}

const DataSection: React.FC<PropTypes> = ({ searchFieldRef }) => {
	const { barcode, setBarcode, csvData, setCsvData, fileUploaded, setFileUploaded, setFileHistory } = useData()

	const [newField, setNewField] = useState('')
	const [newFieldAdded, setNewFieldAdded] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedRow, setSelectedRow] = useState(-1)

	const filteredData = csvData.data.slice(1).map((row: string[], index: number) => ({ row, orgInd: index })).filter(({ row }) =>
		row.some((cell: string) =>
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
		const csv = Papa.unparse(csvData.data)
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = csvData.fileName ? `${csvData.fileName.split('.').slice(0, -1).join('.')}_barcoded.csv` : 'file_barcoded.csv';
		link.style.visibility = 'hidden'

		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const handleDeselect = () => {
		setFileUploaded(false)
		setCsvData({ id: '', fileName: '', data: [] })
		setNewField('')
		setNewFieldAdded(false)
		setSearchQuery('')
		setSelectedRow(-1)
	}

	// This section for handling localstorage
	const getLocalstorageFile = () => JSON.parse(localStorage.getItem(LS_FILESNAME) || '[]')
	const setLocalstorageFile = (files: FileType[]) => localStorage.setItem(LS_FILESNAME, JSON.stringify(files))
	const saveFiles = (files: FileType[]) => {
		setLocalstorageFile(files)
		setFileHistory(files)
	}

	const updateFileDataInLocalstorage = () => {
		const existingFiles = getLocalstorageFile()
		const updatedFiles = existingFiles.map((file: FileType) =>
			file.id === csvData.id ? { ...file, data: csvData.data, updatedAt: new Date().toISOString() } : file
		)

		saveFiles(updatedFiles)
	}

	useEffect(() => {
		if (!csvData.id || csvData.data.length === 0) return
		updateFileDataInLocalstorage()
	}, [csvData])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.code === 'Enter' && newField && barcode && selectedRow !== -1) {
				handleAddBarcode()
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [newField, barcode, selectedRow])


	return (
		<div className="data-section w-7/12 h-full p-6 rounded-lg flex flex-col gap-2 shadow-lg bg-base">
			{
				!fileUploaded ?
					<FileSelectSection />
					: <>
						<div className="nav-bar w-full border-b-2 border-base-2 mb-4 flex justify-between">
							<div onClick={handleDeselect} className="go-back p-1 pr-3 rounded-full flex gap-1 hover:bg-base-2 text-txt-depressed hover:text-txt font-semibold cursor-pointer">
								<img src="https://www.svgrepo.com/show/494008/back.svg" alt="back" className='w-5 invert' />
								<span>Go back</span>
							</div>
							<div className='file-name flex gap-1 items-center'>
								<img src="https://www.svgrepo.com/show/458680/file-dock.svg" alt="file" className='h-4 invert' />
								<span>File: <span className='text-txt-depressed'>{csvData.fileName}</span></span>
							</div>
						</div>
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
					</>
			}
		</div>
	)
}

export default DataSection