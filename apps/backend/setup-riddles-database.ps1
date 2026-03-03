# ============================================================================
# Setup Riddle Database Tables
# ============================================================================
# This script creates the necessary database tables for the riddle system
# ============================================================================

Write-Host "🗄️  Setting up Riddle Database Tables..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules not found. Please run 'npm install' first." -ForegroundColor Red
    exit 1
}

# Run TypeORM migration
Write-Host "📦 Running database migration..." -ForegroundColor Yellow
try {
    npx typeorm-ts-node-commonjs migration:run -d ./src/database/data-source.ts
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Migration command failed. Trying alternative approach..." -ForegroundColor Yellow
    
    # Try using ts-node directly
    try {
        npx ts-node -e "
        import { DataSource } from 'typeorm';
        import { CreateRiddleTables1700000000000 } from './src/database/migrations/1700000000000-CreateRiddleTables';
        
        const dataSource = new DataSource({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [],
          synchronize: false,
        });
        
        async function runMigration() {
          await dataSource.initialize();
          const migration = new CreateRiddleTables1700000000000();
          await migration.up(dataSource.createQueryRunner());
          console.log('Migration completed!');
          await dataSource.destroy();
        }
        
        runMigration().catch(console.error);
        "
    } catch {
        Write-Host "❌ Migration failed. Please run the SQL manually:" -ForegroundColor Red
        Write-Host ""
        Write-Host "SQL to execute:"
        Write-Host "-------------"
        Get-Content ./src/database/migrations/1700000000000-CreateRiddleTables.ts | Select-String "CREATE TABLE" -Context 0,5
    }
}

Write-Host ""
Write-Host "🌱 Seeding riddle data..." -ForegroundColor Yellow
try {
    npx ts-node ./src/database/seed-riddles.ts
    Write-Host "✅ Seed completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Seed failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Setup complete! The riddle tables should now exist." -ForegroundColor Green
Write-Host ""
Write-Host "You can verify by running these SQL queries in your database:" -ForegroundColor Cyan
Write-Host "  SELECT * FROM riddle_subjects;" -ForegroundColor Gray
Write-Host "  SELECT * FROM riddle_chapters;" -ForegroundColor Gray
Write-Host "  SELECT * FROM quiz_riddles;" -ForegroundColor Gray
