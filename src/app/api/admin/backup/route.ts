import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  createBackup,
  deleteBackup,
  getBackupFile,
  getBackups,
  getDatabase,
  restoreBackup,
  restoreUploadedBackup,
  validateDatabaseSchema,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download');
    const filename = searchParams.get('filename');

    if (download) {
      if (filename) {
        const fileObj = await getBackupFile(filename);
        if (!fileObj) {
          return NextResponse.json({ error: 'Archivo de backup no encontrado' }, { status: 404 });
        }
        return new NextResponse(fileObj.content, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${fileObj.filename}"`,
          },
        });
      }

      // Download active database state
      const db = await getDatabase();
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
    return NextResponse.json({ error: 'Error al gestionar backups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { action, label, filename, backupData } = body;

    // 1. Create a manual snapshot backup
    if (action === 'create') {
      const backup = await createBackup(label || 'Manual');
      return NextResponse.json({ success: true, backup });
    }

    // 2. Restore an existing backup from server
    if (action === 'restore') {
      const success = await restoreBackup(filename);
      if (!success) {
        return NextResponse.json(
          { error: 'No se pudo restaurar el backup o el archivo no existe' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Base de datos restaurada correctamente desde el punto de restauración.',
      });
    }

    // 3. Validate a JSON payload before restoring
    if (action === 'validate') {
      const validation = validateDatabaseSchema(backupData);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        stats: validation.stats,
      });
    }

    // 4. Upload and restore from a JSON file loaded from user's PC
    if (action === 'upload_restore') {
      const validation = validateDatabaseSchema(backupData);
      if (!validation.valid || !validation.normalizedData) {
        return NextResponse.json(
          { error: validation.error || 'El archivo JSON no tiene un formato válido' },
          { status: 400 }
        );
      }

      const result = await restoreUploadedBackup(validation.normalizedData);
      return NextResponse.json({
        success: true,
        message: `¡Base de datos restaurada con éxito! Se recuperaron ${result.stats.userCount} jugadores, ${result.stats.leagueCount} liga(s), ${result.stats.roundCount} jornadas y ${result.stats.matchCount} partidos.`,
        stats: result.stats,
      });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in backup POST handler:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el backup' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Falta el nombre del archivo' }, { status: 400 });
    }

    const deleted = await deleteBackup(filename);
    if (!deleted) {
      return NextResponse.json(
        { error: 'No se pudo eliminar el backup o no está permitido' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Backup eliminado correctamente' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar backup' }, { status: 500 });
  }
}
