
export function formatCurrency(

  amount: number

) {

  return new Intl.NumberFormat(

    "en-IN",

    {

      style: "currency",

      currency: "INR"

    }

  ).format(amount)

}

export function formatDate(

  date: Date | string

) {

  return new Date(date)

    .toLocaleDateString(

      "en-IN"

    )

}

export function generateReference(

  id: string

) {

  return `EM-${id}`

}
 
