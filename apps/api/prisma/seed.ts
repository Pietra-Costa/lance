/**
 * Seed demonstrativo da Lance — Casa de Leilões.
 *
 * Requisito do desafio (Verzel, seção "Dados de teste"):
 *   "Deixe semeados um leiloeiro, dois clientes e ao menos um lote publicado
 *    com lances abertos, para que possamos percorrer o fluxo sem montar tudo
 *    do zero."
 *
 * Características:
 * - Idempotente: pode ser executado várias vezes sem duplicar registros.
 * - Determinístico: mesmos e-mails, mesmos valores, mesmas datas relativas.
 * - Senhas com Argon2id, o mesmo algoritmo usado pela aplicação.
 * - Dados pessoais fictícios.
 *
 * Uso:
 *   npm run db:seed --workspace @lance/api
 *
 * Variáveis de ambiente:
 *   DATABASE_URL        (obrigatória)
 *   SEED_DEMO_PASSWORD  (obrigatória, mínimo 10 caracteres)
 */

import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import {
  BidReservationStatus,
  CatalogSource,
  LotStatus,
  UserRole,
  WalletTransactionType,
} from '../generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;
const demoPassword = process.env.SEED_DEMO_PASSWORD;

if (!connectionString) {
  throw new Error('DATABASE_URL não foi definida.');
}

if (!demoPassword || demoPassword.length < 10) {
  throw new Error(
    'Defina SEED_DEMO_PASSWORD com pelo menos 10 caracteres no .env.',
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAILS = {
  seller: 'leiloeiro.demo@lance.local',
  bidderA: 'licitante.demo@lance.local',
  bidderB: 'licitante2.demo@lance.local',
};

const DEMO_PASSWORD_HINT = demoPassword;
const INITIAL_BALANCE_CENTS = 500_000; // R$ 5.000,00
const STARTING_PRICE_CENTS = 10_000; // R$ 100,00
const MIN_INCREMENT_CENTS = 1_000; // R$ 10,00
const BID_A_CENTS = 10_000; // R$ 100,00 (lance inicial, superado)
const BID_B_CENTS = 11_000; // R$ 110,00 (lance líder)

const SELLER_AGREEMENT_VERSION = '1.0.0';
const SELLER_AGREEMENT_CONTENT =
  'LANCE_DEMO_SELLER_AGREEMENT_V1_NOT_A_LEGAL_CONTRACT';

const DEMO_CATALOG_ITEMS = [
  {
    source: CatalogSource.MET,
    externalId: 'demo-sunflowers',
    title: 'Girassóis — estudo de demonstração',
    description:
      'Item fictício criado pelo seed para percorrer o fluxo completo de leilão. Não corresponde a uma obra real.',
    creator: 'Ateliê Lance (demonstração)',
    sourceUrl: 'https://example.test/catalog/demo-sunflowers',
    category: 'Arte',
    attributes: {
      demo: true,
      medium: 'Óleo sobre tela (ficcional)',
      date: '2026',
    },
    // Verificada em 2026-10-28 (HTTP 200).
    imageUrl:
      'https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg',
  },
  {
    source: CatalogSource.ART_INSTITUTE_CHICAGO,
    externalId: 'demo-water-lilies',
    title: 'Ninfeias ao entardecer — estudo de demonstração',
    description:
      'Segundo item fictício do seed, usado para lotes agendados. Não corresponde a uma obra real.',
    creator: 'Ateliê Lance (demonstração)',
    sourceUrl: 'https://example.test/catalog/demo-water-lilies',
    category: 'Arte',
    attributes: {
      demo: true,
      medium: 'Pintura digital (ficcional)',
      date: '2026',
    },
    // O AIC bloqueia hotlink por IIIF (403) e o Met é mais estável,
    // então o segundo item demonstrativo também usa uma imagem do Met.
    imageUrl:
      'https://images.metmuseum.org/CRDImages/ep/web-large/DP-19279-001.jpg',
  },
];

async function upsertUser(params: {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
      passwordHash: params.passwordHash,
    },
    create: {
      name: params.name,
      email: params.email,
      role: params.role,
      passwordHash: params.passwordHash,
    },
    select: { id: true, email: true, name: true, role: true },
  });
}

async function upsertWallet(userId: string, balanceCents: number) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balanceCents, reservedCents: 0 },
    select: { id: true, balanceCents: true, reservedCents: true },
  });
}

/**
 * Garante o saldo inicial e o lançamento no ledger sem duplicar.
 * Usa a chave de idempotência do ledger como trava.
 */
async function ensureSeedDeposit(params: {
  walletId: string;
  userId: string;
  amountCents: number;
}) {
  const idempotencyKey = `seed-deposit:${params.userId}`;

  const existing = await prisma.walletTransaction.findUnique({
    where: { idempotencyKey },
    select: { id: true },
  });

  if (existing) {
    return { created: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: params.walletId },
      data: { balanceCents: { increment: params.amountCents } },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: params.walletId,
        type: WalletTransactionType.DEPOSIT,
        amountCents: params.amountCents,
        idempotencyKey,
        referenceType: 'SEED',
        referenceId: params.userId,
        description: 'Saldo demonstrativo criado pelo seed',
      },
    });
  });

  return { created: true };
}

async function upsertCatalogItem(item: (typeof DEMO_CATALOG_ITEMS)[number]) {
  const catalogItem = await prisma.catalogItem.upsert({
    where: {
      source_externalId: {
        source: item.source,
        externalId: item.externalId,
      },
    },
    update: {
      title: item.title,
      description: item.description,
      creator: item.creator,
      sourceUrl: item.sourceUrl,
      attributes: item.attributes,
    },
    create: {
      source: item.source,
      externalId: item.externalId,
      category: item.category,
      title: item.title,
      description: item.description,
      creator: item.creator,
      sourceUrl: item.sourceUrl,
      attributes: item.attributes,
    },
  });

  const existingImage = await prisma.catalogItemImage.findFirst({
    where: { catalogItemId: catalogItem.id, sourceUrl: item.imageUrl },
    select: { id: true },
  });

  if (!existingImage) {
    await prisma.catalogItemImage.create({
      data: {
        catalogItemId: catalogItem.id,
        sourceUrl: item.imageUrl,
        usageStatus: 'UNKNOWN',
        attribution: 'Imagem de referência para demonstração',
      },
    });
  }

  return catalogItem;
}

/**
 * Cria (ou reutiliza) um lote com snapshot do item.
 * O snapshot é imutável depois de publicado.
 */
async function ensureLot(params: {
  sellerId: string;
  catalogItemId: string;
  title: string;
  description: string | null;
  source: CatalogSource;
  externalId: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  attributes: Prisma.InputJsonValue;
  status: LotStatus;
  category: string;
  startingPriceCents: number;
  minIncrementCents: number;
  startsAt: Date;
  endsAt: Date;
}) {
  const existing = await prisma.lot.findFirst({
    where: {
      sellerId: params.sellerId,
      itemSnapshot: { catalogItemId: params.catalogItemId },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      lot: await prisma.lot.findUniqueOrThrow({ where: { id: existing.id } }),
      created: false,
    };
  }

  const lot = await prisma.lot.create({
    data: {
      sellerId: params.sellerId,
      status: params.status,
      category: params.category,
      startingPriceCents: params.startingPriceCents,
      currentPriceCents: 0,
      minIncrementCents: params.minIncrementCents,
      startsAt: params.startsAt,
      endsAt: params.endsAt,
      itemSnapshot: {
        create: {
          catalogItemId: params.catalogItemId,
          title: params.title,
          description: params.description,
          source: params.source,
          externalId: params.externalId,
          sourceUrl: params.sourceUrl,
          imageUrl: params.imageUrl,
          attributes: params.attributes,
        },
      },
    },
  });

  return { lot, created: true };
}

/**
 * Cria um lance histórico com reserva ativa no ledger.
 * Usado apenas para montar o cenário inicial do lote ao vivo.
 */
async function ensureBid(params: {
  lotId: string;
  bidderId: string;
  walletId: string;
  amountCents: number;
  createdAt: Date;
  isLeader: boolean;
}) {
  const existing = await prisma.bid.findFirst({
    where: {
      lotId: params.lotId,
      bidderId: params.bidderId,
      amountCents: params.amountCents,
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const bid = await prisma.bid.create({
    data: {
      lotId: params.lotId,
      bidderId: params.bidderId,
      amountCents: params.amountCents,
      createdAt: params.createdAt,
    },
    select: { id: true },
  });

  await prisma.bidReservation.create({
    data: {
      walletId: params.walletId,
      lotId: params.lotId,
      bidId: bid.id,
      amountCents: params.amountCents,
      status: params.isLeader
        ? BidReservationStatus.ACTIVE
        : BidReservationStatus.RELEASED,
    },
  });

  if (params.isLeader) {
    await prisma.wallet.update({
      where: { id: params.walletId },
      data: { reservedCents: { increment: params.amountCents } },
    });
  }

  return bid.id;
}

async function main() {
  console.log('Iniciando seed demonstrativo da Lance...');

  const passwordHash = await argon2.hash(DEMO_PASSWORD_HINT, {
    type: argon2.argon2id,
  });

  // 1. Usuários: um leiloeiro e dois licitantes.
  const seller = await upsertUser({
    email: DEMO_EMAILS.seller,
    name: 'Leiloeira Demonstração',
    role: UserRole.LEILOEIRO,
    passwordHash,
  });

  const bidderA = await upsertUser({
    email: DEMO_EMAILS.bidderA,
    name: 'Licitante Alfa',
    role: UserRole.LICITANTE,
    passwordHash,
  });

  const bidderB = await upsertUser({
    email: DEMO_EMAILS.bidderB,
    name: 'Licitante Beta',
    role: UserRole.LICITANTE,
    passwordHash,
  });

  // 2. Termo do leiloeiro aceito (necessário para criar lotes).
  const contentHash = createHash('sha256')
    .update(SELLER_AGREEMENT_CONTENT)
    .digest('hex');

  await prisma.sellerAgreement.upsert({
    where: {
      userId_version: {
        userId: seller.id,
        version: SELLER_AGREEMENT_VERSION,
      },
    },
    update: {},
    create: {
      userId: seller.id,
      version: SELLER_AGREEMENT_VERSION,
      contentHash,
    },
  });

  // 3. Carteiras com saldo demonstrativo e lançamento no ledger.
  const walletSeller = await upsertWallet(seller.id, 0);
  const walletA = await upsertWallet(bidderA.id, 0);
  const walletB = await upsertWallet(bidderB.id, 0);

  const depositA = await ensureSeedDeposit({
    walletId: walletA.id,
    userId: bidderA.id,
    amountCents: INITIAL_BALANCE_CENTS,
  });

  const depositB = await ensureSeedDeposit({
    walletId: walletB.id,
    userId: bidderB.id,
    amountCents: INITIAL_BALANCE_CENTS,
  });

  // 4. Itens de catálogo normalizados (fictícios, com origem declarada).
  const itemLive = await upsertCatalogItem(DEMO_CATALOG_ITEMS[0]);
  const itemScheduled = await upsertCatalogItem(DEMO_CATALOG_ITEMS[1]);

  // 5. Lote ao vivo com lances abertos.
  const now = new Date();
  const liveStartsAt = new Date(now.getTime() - 60 * 60 * 1000); // começou há 1h
  const liveEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // termina em 24h

  const { lot: liveLot, created: liveCreated } = await ensureLot({
    sellerId: seller.id,
    catalogItemId: itemLive.id,
    title: itemLive.title,
    description: itemLive.description,
    source: itemLive.source,
    externalId: itemLive.externalId,
    sourceUrl: itemLive.sourceUrl,
    imageUrl: DEMO_CATALOG_ITEMS[0].imageUrl,
    attributes: DEMO_CATALOG_ITEMS[0].attributes,
    status: LotStatus.LIVE,
    category: DEMO_CATALOG_ITEMS[0].category,
    startingPriceCents: STARTING_PRICE_CENTS,
    minIncrementCents: MIN_INCREMENT_CENTS,
    startsAt: liveStartsAt,
    endsAt: liveEndsAt,
  });

  // 6. Histórico de lances: Alfa abriu, Beta cobriu (Beta lidera).
  if (liveCreated) {
    const bidATime = new Date(now.getTime() - 30 * 60 * 1000);
    const bidBTime = new Date(now.getTime() - 10 * 60 * 1000);

    await ensureBid({
      lotId: liveLot.id,
      bidderId: bidderA.id,
      walletId: walletA.id,
      amountCents: BID_A_CENTS,
      createdAt: bidATime,
      isLeader: false,
    });

    await ensureBid({
      lotId: liveLot.id,
      bidderId: bidderB.id,
      walletId: walletB.id,
      amountCents: BID_B_CENTS,
      createdAt: bidBTime,
      isLeader: true,
    });

    await prisma.lot.update({
      where: { id: liveLot.id },
      data: {
        currentLeaderId: bidderB.id,
        currentPriceCents: BID_B_CENTS,
      },
    });
  }

  // 7. Lote agendado, para a vitrine não ter apenas um estado.
  const scheduledStartsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const scheduledEndsAt = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const { lot: scheduledLot } = await ensureLot({
    sellerId: seller.id,
    catalogItemId: itemScheduled.id,
    title: itemScheduled.title,
    description: itemScheduled.description,
    source: itemScheduled.source,
    externalId: itemScheduled.externalId,
    sourceUrl: itemScheduled.sourceUrl,
    imageUrl: DEMO_CATALOG_ITEMS[1].imageUrl,
    attributes: DEMO_CATALOG_ITEMS[1].attributes,
    status: LotStatus.SCHEDULED,
    category: DEMO_CATALOG_ITEMS[1].category,
    startingPriceCents: 25_000,
    minIncrementCents: 2_500,
    startsAt: scheduledStartsAt,
    endsAt: scheduledEndsAt,
  });

  // 8. Relatório final.
  const [bidsCount, walletSnapshot] = await Promise.all([
    prisma.bid.count({ where: { lotId: liveLot.id } }),
    prisma.wallet.findMany({
      where: { userId: { in: [bidderA.id, bidderB.id] } },
      select: { userId: true, balanceCents: true, reservedCents: true },
    }),
  ]);

  console.log('');
  console.log('Seed concluído.');
  console.log('');
  console.log(
    'Contas de demonstração (senha para todas: SEED_DEMO_PASSWORD do .env)',
  );
  console.log(`  Leiloeira  : ${seller.email}`);
  console.log(`  Licitante A: ${bidderA.email}`);
  console.log(`  Licitante B: ${bidderB.email}`);
  console.log('');
  console.log('Lotes:');
  console.log(
    `  AO VIVO    : ${liveLot.id} — "${itemLive.title}" — ${bidsCount} lances, líder Beta`,
  );
  console.log(`  AGENDADO   : ${scheduledLot.id} — "${itemScheduled.title}"`);
  console.log('');
  console.log('Carteiras:');
  for (const wallet of walletSnapshot) {
    const label =
      wallet.userId === bidderA.id
        ? 'Licitante A'
        : wallet.userId === bidderB.id
          ? 'Licitante B'
          : 'Leiloeira';
    const available = wallet.balanceCents - wallet.reservedCents;
    console.log(
      `  ${label.padEnd(11)}: total ${(wallet.balanceCents / 100).toFixed(2)} | reservado ${(wallet.reservedCents / 100).toFixed(2)} | disponível ${(available / 100).toFixed(2)}`,
    );
  }
  console.log('');
  console.log(
    `Depósitos criados nesta execução: ${depositA.created ? 1 : 0} + ${depositB.created ? 1 : 0}`,
  );
  console.log(`Carteira da leiloeira: ${walletSeller.id}`);
  console.log('');
  console.log('O seed é idempotente: executá-lo novamente não duplica dados.');
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
