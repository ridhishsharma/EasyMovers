
"use client"

import { PhoneCall, CalendarDays, Clock, MessageCircle } from "lucide-react"

interface CallbackCardProps {

  callbackRequested: boolean

  setCallbackRequested: React.Dispatch<
    React.SetStateAction<boolean>
  >

  callbackDate: string

  setCallbackDate: React.Dispatch<
    React.SetStateAction<string>
  >

  callbackTime: string

  setCallbackTime: React.Dispatch<
    React.SetStateAction<string>
  >

  callbackRemarks: string

  setCallbackRemarks: React.Dispatch<
    React.SetStateAction<string>
  >

}

export default function CallbackCard({

  callbackRequested,

  setCallbackRequested,

  callbackDate,

  setCallbackDate,

  callbackTime,

  setCallbackTime,

  callbackRemarks,

  setCallbackRemarks

}: CallbackCardProps) {

  return (

    <section className="rounded-2xl border bg-white shadow-sm p-6">

      <div className="flex items-center gap-3">

        <PhoneCall

          size={28}

          className="text-green-600"

        />

        <div>

          <h2 className="text-xl font-bold text-slate-800">

            Expert Callback

          </h2>

          <p className="text-sm text-slate-500">

            Our inventory specialist will contact you.

          </p>

        </div>

      </div>

      <div className="mt-6">

        <label className="flex items-center gap-3">

          <input

            type="checkbox"

            checked={callbackRequested}

            onChange={(e) =>

              setCallbackRequested(

                e.target.checked

              )

            }

            className="h-5 w-5"

          />

          <span className="font-medium text-slate-700">

            Request Expert Callback

          </span>

        </label>

      </div>

      {callbackRequested && (

        <>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* Date */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

                <CalendarDays size={16} />

                Preferred Date

              </label>

              <input

                type="date"

                value={callbackDate}

                onChange={(e) =>

                  setCallbackDate(

                    e.target.value

                  )

                }

                className="w-full rounded-xl border border-slate-300 p-3"

              />

            </div>

            {/* Time */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

                <Clock size={16} />

                Preferred Time Slot

              </label>

              <select

                value={callbackTime}

                onChange={(e) =>

                  setCallbackTime(

                    e.target.value

                  )

                }

                className="w-full rounded-xl border border-slate-300 p-3"

              >

                <option value="">

                  Select Time

                </option>

                <option>

                  09:00 AM - 11:00 AM

                </option>

                <option>

                  11:00 AM - 01:00 PM

                </option>

                <option>

                  01:00 PM - 03:00 PM

                </option>

                <option>

                  03:00 PM - 05:00 PM

                </option>

                <option>

                  05:00 PM - 07:00 PM

                </option>

              </select>

            </div>

          </div>

          {/* Notes */}

          <div className="mt-6">

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <MessageCircle size={16} />

              Additional Notes

            </label>

            <textarea

              rows={4}

              value={callbackRemarks}

              onChange={(e) =>

                setCallbackRemarks(

                  e.target.value

                )

              }

              placeholder="Preferred language, best time to call, special requirements..."

              className="w-full rounded-xl border border-slate-300 p-3"

            />

          </div>

          {/* Info */}

          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">

            <p className="text-sm text-green-700">

              ✅ Our inventory specialist will call you on your registered mobile number.

              <br />

              📞 The call usually lasts 10–15 minutes.

              <br />

              📋 Keep your inventory ready for faster quotation.

            </p>

          </div>

        </>

      )}

    </section>

  )

}
 
