export function isEmail(

  email: string

) {

  return /\S+@\S+\.\S+/

    .test(email)

}

export function isPhone(

  phone: string

) {

  return /^[6-9]\d{9}$/

    .test(phone)

}

export function isEmpty(

  value: string

) {

  return value.trim() === ""

}
 
