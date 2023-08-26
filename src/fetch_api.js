import axios from 'axios';

const URL = 'https://pixabay.com/api/';
const apiKey = '38681482-0dec064188143fb82389b90e0';

async function fetchImage({ page = 1, perPage = 10, searchItem = '' }) {
  const params = {
    key: apiKey,
    image_type: 'photo',
    orientation: 'horizontal',
    pretty: 'true',
    safesearch: 'true',
    page: page,
    per_page: perPage,
    q: searchItem,
  };
  const response = await axios.get(URL, { params });
  return response.data;
}

export { fetchImage };
