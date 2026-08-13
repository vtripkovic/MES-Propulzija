import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const departments = [
    {
      code: "LIM",
      name: "Limarija",
    },
    {
      code: "BRA",
      name: "Bravarija",
    },
    {
      code: "PLA",
      name: "Plastifikacija",
    },
    {
      code: "STA",
      name: "Štampa",
    },
    {
      code: "MMA",
      name: "Multimedia / Assembly",
    },
    {
      code: "BRP",
      name: "Branding / Packaging",
    },
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: {
        code: department.code,
      },
      update: {
        name: department.name,
      },
      create: department,
    });
    }

    const stampa = await prisma.department.findUnique({
    where: {
        code: "STA",
    },
    });

    if (!stampa) {
    throw new Error("Department STA not found");
    }

    const machines = [
    {
        code: "HP-LATEX-2000-01",
        name: "HP Latex 2000",
    },
    {
        code: "HP-LATEX-2000-02",
        name: "HP Latex 2000",
    },
    {
        code: "HP-LATEX-570-01",
        name: "HP Latex 570",
    },
    {
        code: "KONGSBERG-C64-01",
        name: "Kongsberg C64",
    },
    {
        code: "LASER-01",
        name: "Laser",
    },
    ];

    for (const machine of machines) {
    await prisma.machine.upsert({
        where: {
        code: machine.code,
        },
        update: {
        name: machine.name,
        departmentId: stampa.id,
        },
        create: {
        ...machine,
        departmentId: stampa.id,
        },
    });
    }

      const products = [
    {
      code: "PROP-001",
      name: "Testni proizvod",
      description: "Glavni testni proizvod",
    },
    {
      code: "ASM-001",
      name: "Glavni sklop",
      description: "Glavni sklop proizvoda",
    },
    {
      code: "ASM-002",
      name: "Podsklop A",
      description: "Prvi podsklop",
    },
    {
      code: "ASM-003",
      name: "Podsklop B",
      description: "Drugi podsklop",
    },
    {
      code: "PART-001",
      name: "Deo A1",
      description: "Komponenta podsklopa A",
    },
    {
      code: "PART-002",
      name: "Deo A2",
      description: "Komponenta podsklopa A",
    },
    {
      code: "PART-003",
      name: "Deo B1",
      description: "Komponenta podsklopa B",
    },
    {
      code: "PART-004",
      name: "Kupljena komponenta",
      description: "Kupljena komponenta",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        code: product.code,
      },
      update: {
        name: product.name,
        description: product.description,
      },
      create: product,
    });
  }

    const bomItems = [
    {
      parentCode: "PROP-001",
      childCode: "ASM-001",
      quantity: 1,
    },
    {
      parentCode: "PROP-001",
      childCode: "PART-004",
      quantity: 6,
    },
    {
      parentCode: "ASM-001",
      childCode: "ASM-002",
      quantity: 1,
    },
    {
      parentCode: "ASM-001",
      childCode: "ASM-003",
      quantity: 1,
    },
    {
      parentCode: "ASM-002",
      childCode: "PART-001",
      quantity: 2,
    },
    {
      parentCode: "ASM-002",
      childCode: "PART-002",
      quantity: 4,
    },
    {
      parentCode: "ASM-003",
      childCode: "PART-003",
      quantity: 1,
    },
  ];

  for (const item of bomItems) {
    const parent = await prisma.product.findUnique({
      where: {
        code: item.parentCode,
      },
    });

    const child = await prisma.product.findUnique({
      where: {
        code: item.childCode,
      },
    });

    if (!parent || !child) {
      throw new Error(
        `Product not found: ${item.parentCode} -> ${item.childCode}`,
      );
    }

    await prisma.bOMItem.upsert({
      where: {
        parentId_childId: {
          parentId: parent.id,
          childId: child.id,
        },
      },
      update: {
        quantity: item.quantity,
      },
      create: {
        parentId: parent.id,
        childId: child.id,
        quantity: item.quantity,
      },
    });
  }

    const product = await prisma.product.findUnique({
    where: {
      code: "PROP-001",
    },
  });

  if (!product) {
    throw new Error("Product PROP-001 not found");
  }

  const routing = await prisma.routing.upsert({
    where: {
      productId_revision: {
        productId: product.id,
        revision: "A",
      },
    },
    update: {},
    create: {
      productId: product.id,
      revision: "A",
    },
  });

    const operations = [
    {
      sequence: 10,
      name: "Štampa",
      type: "PRINTING",
      setupTime: 15,
      cycleTime: 2,
    },
    {
      sequence: 20,
      name: "Sečenje",
      type: "CUTTING",
      setupTime: 10,
      cycleTime: 1,
    },
    {
      sequence: 30,
      name: "Kontrola",
      type: "QUALITY_CONTROL",
      setupTime: 0,
      cycleTime: 2,
    },
  ];

    const createdOperations = [];

  for (const operationData of operations) {
    const operation = await prisma.operation.upsert({
      where: {
        routingId_sequence: {
          routingId: routing.id,
          sequence: operationData.sequence,
        },
      },
      update: {
        name: operationData.name,
        type: operationData.type,
        setupTime: operationData.setupTime,
        cycleTime: operationData.cycleTime,
      },
      create: {
        routingId: routing.id,
        sequence: operationData.sequence,
        name: operationData.name,
        type: operationData.type,
        setupTime: operationData.setupTime,
        cycleTime: operationData.cycleTime,
      },
    });

    createdOperations.push(operation);
  }

    const stampaMachines = await prisma.machine.findMany({
    where: {
      code: {
        in: [
          "HP-LATEX-2000-01",
          "HP-LATEX-2000-02",
          "HP-LATEX-570-01",
        ],
      },
    },
  });

  const printingOperation = createdOperations.find(
    (operation) => operation.sequence === 10,
  );

  if (!printingOperation) {
    throw new Error("Printing operation not found");
  }

  for (const machine of stampaMachines) {
    await prisma.operationMachine.upsert({
      where: {
        operationId_machineId: {
          operationId: printingOperation.id,
          machineId: machine.id,
        },
      },
      update: {},
      create: {
        operationId: printingOperation.id,
        machineId: machine.id,
      },
    });
  }

    const kongsberg = await prisma.machine.findUnique({
    where: {
      code: "KONGSBERG-C64-01",
    },
  });

  const cuttingOperation = createdOperations.find(
    (operation) => operation.sequence === 20,
  );

  if (!cuttingOperation) {
    throw new Error("Cutting operation not found");
  }

  if (kongsberg) {
    await prisma.operationMachine.upsert({
      where: {
        operationId_machineId: {
          operationId: cuttingOperation.id,
          machineId: kongsberg.id,
        },
      },
      update: {},
      create: {
        operationId: cuttingOperation.id,
        machineId: kongsberg.id,
      },
    });
  }

    const workOrderProduct = await prisma.product.findUnique({
    where: {
      code: "PROP-001",
    },
  });

  if (!workOrderProduct) {
    throw new Error("Product PROP-001 not found");
  }

  const workOrder = await prisma.workOrder.upsert({
    where: {
      number: "WO-2026-0001",
    },
    update: {
      quantity: 10,
      status: "PLANNED",
    },
    create: {
      number: "WO-2026-0001",
      productId: workOrderProduct.id,
      quantity: 10,
      status: "PLANNED",
    },
  });

  const workOrderRouting = await prisma.routing.findUnique({
    where: {
      productId_revision: {
        productId: workOrderProduct.id,
        revision: "A",
      },
    },
    include: {
      operations: {
        orderBy: {
          sequence: "asc",
        },
      },
    },
  });

  if (!workOrderRouting) {
    throw new Error("Routing A for PROP-001 not found");
  }

  for (const operation of workOrderRouting.operations) {
    await prisma.operationExecution.upsert({
      where: {
        id: `${workOrder.id}-${operation.id}`,
      },
      update: {
        status: "WAITING",
      },
      create: {
        id: `${workOrder.id}-${operation.id}`,
        workOrderId: workOrder.id,
        operationId: operation.id,
        status: "WAITING",
      },
    });
  }


  console.log("Departments seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });