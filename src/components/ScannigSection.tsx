import React, { useState, useRef, useEffect } from "react"
import Webcam from 'react-webcam'
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library'

import useData from "../hooks/useData"

interface PropTypes {
	searchFieldRef: React.RefObject<HTMLInputElement>
}

const ScannigSection: React.FC<PropTypes> = ({ searchFieldRef }) => {
	const {
		barcode,
		setBarcode,
	} = useData()

	const webcamRef = useRef<Webcam>(null)
	const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

	const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo | null>(null)
	const [isScanning, setIsScanning] = useState<boolean>(false)

	const [errMessage, setErrMessage] = useState('')

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

	useEffect(() => {
		const getVideoDevices = async () => {
			try {
				setErrMessage('')
				const devices = await navigator.mediaDevices.enumerateDevices()
				const cameras = devices.filter((device) => device.kind === "videoinput")

				setVideoDevices(cameras)
				if (cameras.length > 0) {
					setSelectedDevice(cameras[0])
				}

				// If no camera is found it returns a camera with empty data
				// if (!cameras[0].deviceId) setErrMessage('No cameras found. Please allow camera access or ensure camera is connected and try again..')
			} catch (error) {
				console.error("Error getting video devices: ", error)
				setErrMessage("Please allow Camera access to start scanning...")
			}
		}

		getVideoDevices()
	}, [])

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
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [])

	if (errMessage) return (
		<div className="scanner w-4/12 h-fit p-10 rounded-lg shadow-lg flex flex-col gap-2 items-center bg-base">
			<img src="https://www.svgrepo.com/show/208839/no-pictures-no-camera.svg" alt="no-cam" className="w-20 invert opacity-20" />
			<div className="p-4 text-danger text-center">{errMessage}</div>
		</div>
	)

	return (
		<div className="scanner w-4/12 h-fit p-10 rounded-lg shadow-lg flex flex-col gap-2 items-center bg-base">
			<select
				value={selectedDevice?.deviceId || ""}
				onChange={e => setSelectedDevice(videoDevices.find(camera => camera.deviceId === e.target.value) || null)}
				className='cam-select w-full p-2 border border-base-2 rounded-lg shadow-lg bg-base-2'
			>
				{/* <option value="">Select a camera</option> */}
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
	)
}

export default ScannigSection