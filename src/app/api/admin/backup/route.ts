import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createBackup, getBackups, getDatabase, restoreBackup } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download');

    if (download) {
      const db = getDatabase();
      return new NextResponse(JSON.stringify(db, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="ccrew_database_backup_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    const backups = await getBackups();
    return NextResponse.json({ success: true, backups });
  } catch (error) {
    return NextResponse.json({ error: 'Error al listar backups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { action, label, filename } = await req.json();

    if (action === 'create') {
      const backup = await createBackup(label || 'Manual');
      return NextResponse.json({ success: true, backup });
    }

    if (action === 'restore') {
      const success = await restoreBackup(filename);
      if (!success) {
        return NextResponse.json({ error: 'No se pudo restaurar el backup o el archivo no existe' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Base de datos restaurada correctamente' });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al gestionar backup' }, { status: 500 });
  }
}
