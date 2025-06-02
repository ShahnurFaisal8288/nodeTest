const axios = require("axios");

const getTransactionsModifiedTermSaving = async (req, res) => {
  try {
    const {
      BranchCode,
      CONo,
      ProjectCode,
      StartDate,
      EndDate,
      UpdatedAt,
      key,
      caller,
      EndDateTime
    } = req.query;

    const baseUrl = "https://your-api-url.com/"; // Change this to your base API URL
    let url = `${baseUrl}TransactionsModifiedTermSavings?BranchCode=${BranchCode}&CONo=${CONo}&ProjectCode=${ProjectCode}&StartDate=${StartDate}&EndDate=${EndDate}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
    url = url.replace(/ /g, "%20");

    let lastid = "";
    let hasNext = true;
    let resultArray = [];

    while (hasNext) {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/json",
        },
      });

      const json = response.data;
      const { code, message, data, nextUrl } = json;

      if (message === "No data found") {
        break;
      }

      if (code === "200" && Array.isArray(data) && data.length > 0) {
        resultArray.push(...data);
      }

      if (nextUrl) {
        const urlParts = nextUrl.split("&");
        const lastIdParam = urlParts.find(p => p.startsWith("LastId="));
        if (lastIdParam) {
          lastid = lastIdParam.split("=")[1];
          url = `${baseUrl}TransactionsModifiedTermSavings?BranchCode=${BranchCode}&ProjectCode=${ProjectCode}&StartDate=${StartDate}&EndDate=${EndDate}&CONo=${CONo}&UpdatedAt=${UpdatedAt}&LastId=${lastid}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
          url = url.replace(/ /g, "%20");
        } else {
          hasNext = false;
        }
      } else {
        hasNext = false;
      }
    }

    return res.json({
      code: "200",
      message: "Success",
      data: resultArray,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({
      code: "500",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  getTransactionsModifiedTermSaving,
};
