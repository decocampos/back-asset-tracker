// Arquivo: teste-registro.js
const url = 'http://localhost:3000/api/auth/register';

const dados = {
  email: "avcl@cin.ufpe.br",
  password: "senha123",
  fullName: "Andre Campos",
  birthDate: "1999-10-20",
  phone: "11999999999"
};

console.log("Tentando registrar usuário...");

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(dados)
})
.then(async response => {
  const json = await response.json();
  console.log("Status Code:", response.status);
  console.log("Resposta do Servidor:", JSON.stringify(json, null, 2));
})
.catch(error => {
  console.error("Erro na requisição:", error);
});