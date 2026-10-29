import { Logger } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { PrismaService } from '../infrastructure/database/prisma.service';

describe('SettlementsService', () => {
  let service: SettlementsService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      lot: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    service = new SettlementsService(prisma);
  });

  describe('closeAndSettle', () => {
    it('deve propagar uma falha da transação', async () => {
      const error = new Error('Falha simulada na transação');
      (prisma.$transaction as jest.Mock).mockRejectedValue(error);

      await expect(service.closeAndSettle('lot-1')).rejects.toBe(error);
    });
  });

  describe('reconcile', () => {
    it('deve registrar o erro e continuar quando um lote falha', async () => {
      const loggerError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      // Primeira consulta: lotes SCHEDULED a ativar. Segunda: lotes LIVE vencidos.
      (prisma.lot.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'lot-1' }, { id: 'lot-2' }]);

      (prisma.$transaction as jest.Mock)
        .mockRejectedValueOnce(new Error('Falha simulada'))
        .mockResolvedValueOnce({ id: 'settlement-2' });

      await service.reconcile();

      // Apenas os dois lotes vencidos passam por transacao.
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(loggerError).toHaveBeenCalledWith(
        'Falha ao liquidar lote lot-1',
        expect.any(String),
      );

      loggerError.mockRestore();
    });
  });
});
