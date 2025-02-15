export const fetchEstimatedGas = async (length: number) => {
  try {
    const url = new URL(
      `https://api-arabica-11.celenium.io/v1/gas/estimate_for_pfb?sizes=${length}`
    );

    const response = await fetch(url.href);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};
