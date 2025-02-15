export const fetchAddressByHash = async (hash: string) => {
  try {
    const url = new URL(
      `https://api-arabica-11.celenium.io/v1/address/${hash}`
    );

    const response = await fetch(url.href);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};
