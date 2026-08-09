import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL??'http://localhost:4000/api',withCredentials:true});
api.interceptors.request.use(c=>{const token=localStorage.getItem('accessToken');if(token)c.headers.Authorization=`Bearer ${token}`;return c;});
let refreshing=false;api.interceptors.response.use(r=>r,async error=>{const original=error.config;if(error.response?.status===401&&!original?._retry&&!original?.url?.includes('/auth/')){original._retry=true;if(!refreshing){refreshing=true;try{const {data}=await api.post('/auth/refresh');localStorage.setItem('accessToken',data.data.accessToken);}catch{localStorage.removeItem('accessToken');}finally{refreshing=false;}}if(localStorage.getItem('accessToken'))return api(original);}return Promise.reject(error);});
export const errorMessage=(e:unknown)=>axios.isAxiosError(e)?(e.response?.data as {message?:string})?.message??e.message:'Something went wrong';

