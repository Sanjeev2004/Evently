import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL??'http://localhost:4000/api',withCredentials:true,timeout:15000});
api.interceptors.request.use(c=>{const token=localStorage.getItem('accessToken');if(token)c.headers.Authorization=`Bearer ${token}`;return c;});
let refreshPromise: Promise<string> | null = null;
api.interceptors.response.use(r=>r,async error=>{
  const original=error.config;
  if(error.response?.status===401 && original && !original._retry && !original.url?.includes('/auth/')) {
    original._retry=true;
    if(!refreshPromise) refreshPromise=api.post('/auth/refresh').then(({data})=>{
      const token=data.data.accessToken as string; localStorage.setItem('accessToken',token); return token;
    }).catch(e=>{localStorage.removeItem('accessToken');throw e;}).finally(()=>{refreshPromise=null;});
    try { await refreshPromise; return api(original); } catch { return Promise.reject(error); }
  }
  return Promise.reject(error);
});
export const errorMessage=(e:unknown)=>axios.isAxiosError(e)?(e.response?.data as {message?:string})?.message??e.message:'Something went wrong';
