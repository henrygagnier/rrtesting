import {
  readdirSync,
  statSync,
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { format } from "prettier";

const __dirname = dirname(fileURLToPath(import.meta.url));

const generatedContractComment = `
/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
`;

function getDirectories(path) {
  return readdirSync(path).filter(function (file) {
    return statSync(path + "/" + file).isDirectory();
  });
}
function getFiles(path) {
  return readdirSync(path).filter(function (file) {
    return statSync(path + "/" + file).isFile();
  });
}
function getArtifactOfContract(contractName) {
  const current_path_to_artifacts = join(
    __dirname,
    "..",
    `out/${contractName}.sol`
  );
  const artifactJson = JSON.parse(
    readFileSync(`${current_path_to_artifacts}/${contractName}.json`)
  );

  return artifactJson;
}

function getInheritedFromContracts(artifact) {
  let inheritedFromContracts = [];
  if (artifact?.ast) {
    for (const astNode of artifact.ast.nodes) {
      if (astNode.nodeType == "ContractDefinition") {
        if (astNode.baseContracts.length > 0) {
          inheritedFromContracts = astNode.baseContracts.map(
            ({ baseName }) => baseName.name
          );
        }
      }
    }
  }
  return inheritedFromContracts;
}

function getInheritedFunctions(mainArtifact) {
  const inheritedFromContracts = getInheritedFromContracts(mainArtifact);
  const inheritedFunctions = {};
  for (const inheritanceContractName of inheritedFromContracts) {
    const {
      abi,
      ast: { absolutePath },
    } = getArtifactOfContract(inheritanceContractName);
    for (const abiEntry of abi) {
      if (abiEntry.type == "function") {
        inheritedFunctions[abiEntry.name] = absolutePath;
      }
    }
  }
  return inheritedFunctions;
}

function main() {
  const current_path_to_broadcast = join(
    __dirname,
    "..",
    "broadcast/Deploy.s.sol"
  );
  const current_path_to_deployments = join(__dirname, "..", "deployments");

  const chains = getDirectories(current_path_to_broadcast);
  const Deploymentchains = getFiles(current_path_to_deployments);

  const deployments = {};

  Deploymentchains.forEach((chain) => {
    if (!chain.endsWith(".json")) return;
    chain = chain.slice(0, -5);
    var deploymentObject = JSON.parse(
      readFileSync(`${current_path_to_deployments}/${chain}.json`)
    );
    deployments[chain] = deploymentObject;
  });

  const allGeneratedContracts = {};

  chains.forEach((chain) => {
    allGeneratedContracts[chain] = {};
    const broadCastObject = JSON.parse(
      readFileSync(`${current_path_to_broadcast}/${chain}/run-latest.json`)
    );
    const transactionsCreate = broadCastObject.transactions.filter(
      (transaction) => transaction.transactionType == "CREATE"
    );
    transactionsCreate.forEach((transaction) => {
      console.log(deployments[chain]);
      const artifact = getArtifactOfContract(transaction.contractName || "ERC1155EligibiltiyModule");
      allGeneratedContracts[chain][
        deployments[chain][transaction.contractAddress] ||
          transaction.contractName
      ] = {
        address: transaction.contractAddress,
        abi: artifact.abi,
        inheritedFunctions: getInheritedFunctions(artifact),
      };
    });
  });

  const TARGET_DIR = "../nextjs/contracts/";

  const fileContent = Object.entries(allGeneratedContracts).reduce(
    (content, [chainId, chainConfig]) => {
      return `${content}${parseInt(chainId).toFixed(0)}:${JSON.stringify(
        chainConfig,
        null,
        2
      )},`;
    },
    ""
  );

  if (!existsSync(TARGET_DIR)) {
    mkdirSync(TARGET_DIR);
  }
  writeFileSync(
    `${TARGET_DIR}deployedContracts.ts`,
    format(
      `${generatedContractComment} import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract"; \n\n
 const deployedContracts = {${fileContent}} as const; \n\n export default deployedContracts satisfies GenericContractsDeclaration`,
      {
        parser: "typescript",
      }
    )
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}