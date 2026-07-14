
export async function fetcher<T>(

  url: string,

  options?: RequestInit

): Promise<T> {

  const response = await fetch(

    url,

    options

  )

  if (!response.ok) {

    const error = await response.text()

    throw new Error(error)

  }

  return response.json()

}

