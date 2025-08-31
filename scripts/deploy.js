const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ProductTracer = await ethers.getContractFactory("ProductTracer");
  const productTracer = await ProductTracer.deploy();
  
  // Esperar que se confirme el deploy
  await productTracer.waitForDeployment();
  
  const contractAddress = await productTracer.getAddress();
  console.log("✅ ProductTracer deployed to:", contractAddress);

  // Guardar la dirección del contrato para el frontend
  const fs = require('fs');
  const contractsDir = __dirname + "/../frontend/src/utils/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    contractsDir + "/productTracer-address.json",
    JSON.stringify({ ProductTracer: contractAddress }, undefined, 2));

  console.log("📋 Contract address saved to frontend");

  // Guardar el ABI del contrato
  const artifact = artifacts.readArtifactSync("ProductTracer");

  fs.writeFileSync(
    contractsDir + "/ProductTracer.json",
    JSON.stringify(artifact, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});