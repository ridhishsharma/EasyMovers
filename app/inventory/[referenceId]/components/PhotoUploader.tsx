
"use client"

import { useRef } from "react"

import {

  Camera,

  Upload,

  Trash2,

  ImagePlus

} from "lucide-react"

interface PhotoUploaderProps {

  photos: File[]

  setPhotos: React.Dispatch<
    React.SetStateAction<File[]>
  >

}

export default function PhotoUploader({

  photos,

  setPhotos

}: PhotoUploaderProps) {

  const inputRef = useRef<HTMLInputElement>(null)

  //-------------------------------------------------------

  function handleFiles(

    files: FileList | null

  ) {

    if (!files) return

    const selected = Array.from(files)

    setPhotos(previous => [

      ...previous,

      ...selected

    ])

  }

  //-------------------------------------------------------

  function removePhoto(index: number) {

    setPhotos(

      photos.filter((_, i) => i !== index)

    )

  }

  //-------------------------------------------------------

  return (

    <section className="rounded-2xl border bg-white shadow-sm p-6">

      {/* Header */}

      <div className="mb-6">

        <h2 className="text-xl font-bold text-slate-800">

          Upload Inventory Photos

        </h2>

        <p className="text-sm text-slate-500">

          Upload room or item photographs to help us prepare an accurate quotation.

        </p>

      </div>

      {/* Upload Area */}

      <div

        onClick={() =>

          inputRef.current?.click()

        }

        className="cursor-pointer rounded-2xl border-2 border-dashed border-blue-300 bg-slate-50 p-10 text-center transition hover:bg-blue-50"

      >

        <ImagePlus

          size={48}

          className="mx-auto text-blue-600"

        />

        <h3 className="mt-4 text-lg font-semibold text-slate-700">

          Drag & Drop Photos

        </h3>

        <p className="mt-2 text-sm text-slate-500">

          or click to browse

        </p>

        <button

          type="button"

          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white"

        >

          <Upload size={18} />

          Select Photos

        </button>

        <input

          ref={inputRef}

          type="file"

          multiple

          accept="image/*"

          hidden

          onChange={(e) =>

            handleFiles(e.target.files)

          }

        />

      </div>

      {/* Preview */}

      {photos.length > 0 && (

        <div className="mt-8">

          <h3 className="mb-4 text-lg font-semibold text-slate-800">

            Uploaded Photos

          </h3>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {photos.map((photo, index) => (

              <div

                key={index}

                className="overflow-hidden rounded-2xl border bg-white shadow-sm"

              >

                <img

                  src={URL.createObjectURL(photo)}

                  alt={photo.name}

                  className="h-48 w-full object-cover"

                />

                <div className="p-3">

                  <p className="truncate text-sm font-medium">

                    {photo.name}

                  </p>

                  <div className="mt-3 flex justify-between">

                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">

                      <Camera size={14} />

                      {(photo.size / 1024 / 1024).toFixed(2)} MB

                    </span>

                    <button

                      type="button"

                      onClick={() =>

                        removePhoto(index)

                      }

                      className="text-red-600 hover:text-red-700"

                    >

                      <Trash2 size={18} />

                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

    </section>

  )

}
 
