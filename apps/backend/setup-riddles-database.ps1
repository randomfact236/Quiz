# ============================================================================
# Setup Image Riddle Database
# ============================================================================
# Runs migrations and seeds the IMAGE RIDDLE tables (image_riddle_categories,
# image_riddles) from sample-image-riddles.sql.
#
# Note: the old version of this script seeded the TEXT riddle tables
# (riddle_subjects/riddle_chapters/riddle_mcqs) — it was rewritten to target
# image riddles. Text-riddle seeding lives in src/database/seed-riddles.ts.
# ============================================================================

Write-Host "🗄️  Setting up Image Riddle Database..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules not found. Please run 'npm install' first." -ForegroundColor Red
    exit 1
}

# Run TypeORM migration (creates/updates tables from entities)
Write-Host "📦 Running database migration..." -ForegroundColor Yellow
try {
    npx typeorm-ts-node-commonjs migration:run -d ./src/database/data-source.ts
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌱 Seeding image riddle data..." -ForegroundColor Yellow

$pgHost = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$pgPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$pgUser = $env:DB_USERNAME
$pgDb   = $env:DB_DATABASE

$env:PGPASSWORD = $env:DB_PASSWORD
try {
    Get-Content ./sample-image-riddles.sql | psql -h $pgHost -p $pgPort -U $pgUser -d $pgDb
    Write-Host "✅ Seed completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Seed failed (is psql on PATH?): $_" -ForegroundColor Red
    Write-Host "   Apply sample-image-riddles.sql manually against your database." -ForegroundColor Yellow
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎉 Setup complete! Verify with:" -ForegroundColor Green
Write-Host "  SELECT count(*) FROM image_riddle_categories;" -ForegroundColor Gray
Write-Host "  SELECT title, difficulty, status FROM image_riddles;" -ForegroundColor Gray
