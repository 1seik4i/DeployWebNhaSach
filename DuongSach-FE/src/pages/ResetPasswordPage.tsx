import { useState } from 'react';
import { apiClient } from '../services/apiClient';
export function ResetPasswordPage() {
  const [password,setPassword]=useState(''),[message,setMessage]=useState(''),[done,setDone]=useState(false);
  return <main style={{maxWidth:480,margin:'80px auto',padding:24}}><h1>Đặt lại mật khẩu</h1><form onSubmit={async e=>{
    e.preventDefault();try{await apiClient.post('/auth/reset-password',{token:new URLSearchParams(window.location.search).get('token'),newPassword:password});setDone(true);setMessage('Đã đổi mật khẩu. Bạn có thể đăng nhập lại.');}catch(error){setMessage(error instanceof Error?error.message:'Không đổi được mật khẩu');}
  }}><label>Mật khẩu mới<input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={done} type="submit">Đổi mật khẩu</button></form><p role="status">{message}</p><a href="/login">Đăng nhập</a></main>;
}
