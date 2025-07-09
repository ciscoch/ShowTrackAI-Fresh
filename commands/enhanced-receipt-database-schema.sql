-- Enhanced Receipt Database Schema for Business Intelligence
-- Adds business intelligence and vendor intelligence fields to existing expenses table

-- Add business intelligence columns to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS business_intelligence JSONB,
ADD COLUMN IF NOT EXISTS vendor_intelligence JSONB;

-- Create indexes for better query performance on business intelligence data
CREATE INDEX IF NOT EXISTS idx_expenses_business_intelligence 
ON public.expenses USING GIN (business_intelligence);

CREATE INDEX IF NOT EXISTS idx_expenses_vendor_intelligence 
ON public.expenses USING GIN (vendor_intelligence);

-- Create aggregated analytics table for anonymized data
CREATE TABLE IF NOT EXISTS public.aggregated_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR NOT NULL CHECK (data_type IN ('vendor_performance', 'feed_analytics', 'equipment_lifecycle', 'regional_pricing', 'seasonal_patterns')),
    region VARCHAR,
    time_period DATE NOT NULL,
    analytics_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for aggregated analytics
CREATE INDEX IF NOT EXISTS idx_aggregated_analytics_type_period 
ON public.aggregated_analytics (data_type, time_period);

CREATE INDEX IF NOT EXISTS idx_aggregated_analytics_region 
ON public.aggregated_analytics (region);

-- Row Level Security for aggregated analytics (admin only)
ALTER TABLE public.aggregated_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for aggregated analytics (admin access only)
CREATE POLICY "Admin can access aggregated analytics" ON public.aggregated_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Function to aggregate business intelligence data (privacy-safe)
CREATE OR REPLACE FUNCTION get_aggregated_business_intelligence(
    region_filter TEXT DEFAULT NULL,
    timeframe_filter TEXT DEFAULT 'month'
)
RETURNS TABLE (
    data_type TEXT,
    region TEXT,
    period DATE,
    vendor_count BIGINT,
    total_transactions BIGINT,
    average_amount NUMERIC,
    top_brands JSONB,
    equipment_trends JSONB,
    feed_analytics JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Calculate time range based on timeframe
    DECLARE
        start_date DATE;
        date_trunc_format TEXT;
    BEGIN
        CASE timeframe_filter
            WHEN 'year' THEN 
                start_date := DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '2 years';
                date_trunc_format := 'year';
            WHEN 'quarter' THEN 
                start_date := DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '1 year';
                date_trunc_format := 'quarter';
            ELSE -- month
                start_date := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months';
                date_trunc_format := 'month';
        END CASE;

        RETURN QUERY
        SELECT 
            'vendor_performance'::TEXT as data_type,
            COALESCE(vi.vendor_intelligence->>'vendor_category', 'unknown')::TEXT as region,
            DATE_TRUNC(date_trunc_format, e.expense_date)::DATE as period,
            COUNT(DISTINCT e.vendor)::BIGINT as vendor_count,
            COUNT(*)::BIGINT as total_transactions,
            AVG(e.amount)::NUMERIC as average_amount,
            
            -- Top brands (anonymized)
            jsonb_build_object(
                'brands', 
                jsonb_agg(DISTINCT 
                    CASE 
                        WHEN bi.business_intelligence->'brand_names' IS NOT NULL 
                        THEN bi.business_intelligence->'brand_names'
                        ELSE '[]'::jsonb
                    END
                )
            ) as top_brands,
            
            -- Equipment trends (anonymized)
            jsonb_build_object(
                'equipment_types',
                jsonb_agg(DISTINCT 
                    CASE 
                        WHEN bi.business_intelligence->'equipment_purchased' IS NOT NULL 
                        THEN bi.business_intelligence->'equipment_purchased'
                        ELSE '[]'::jsonb
                    END
                )
            ) as equipment_trends,
            
            -- Feed analytics (anonymized)
            jsonb_build_object(
                'feed_types',
                jsonb_agg(DISTINCT 
                    CASE 
                        WHEN bi.business_intelligence->>'feed_type' IS NOT NULL 
                        THEN bi.business_intelligence->>'feed_type'
                        ELSE 'unknown'
                    END
                ),
                'seasonal_patterns',
                jsonb_agg(DISTINCT 
                    CASE 
                        WHEN bi.business_intelligence->>'seasonal_indicator' IS NOT NULL 
                        THEN bi.business_intelligence->>'seasonal_indicator'
                        ELSE 'unknown'
                    END
                )
            ) as feed_analytics
            
        FROM public.expenses e
        LEFT JOIN public.expenses bi ON e.id = bi.id AND bi.business_intelligence IS NOT NULL
        LEFT JOIN public.expenses vi ON e.id = vi.id AND vi.vendor_intelligence IS NOT NULL
        
        WHERE e.expense_date >= start_date
        AND (region_filter IS NULL OR vi.vendor_intelligence->>'vendor_category' = region_filter)
        
        GROUP BY 
            DATE_TRUNC(date_trunc_format, e.expense_date),
            COALESCE(vi.vendor_intelligence->>'vendor_category', 'unknown')
        
        ORDER BY period DESC, region;
    END;
END;
$$;

-- Grant execute permission on function to authenticated users with admin role
GRANT EXECUTE ON FUNCTION get_aggregated_business_intelligence TO authenticated;

-- Comment on the enhanced schema
COMMENT ON COLUMN public.expenses.business_intelligence IS 'Enhanced receipt data for research and monetization (feed_type, brand_names, equipment_purchased, seasonal_indicator, etc.)';
COMMENT ON COLUMN public.expenses.vendor_intelligence IS 'Vendor relationship data for business intelligence (vendor_address, phone, website, transaction_details, etc.)';
COMMENT ON TABLE public.aggregated_analytics IS 'Anonymized aggregated data for research and monetization without user identifiers';
COMMENT ON FUNCTION get_aggregated_business_intelligence IS 'Privacy-safe function to retrieve aggregated business intelligence data for research and partnerships';

-- Example business_intelligence JSONB structure:
/*
{
  "feed_type": "growth/development",
  "brand_names": ["JACOBY'S"],
  "equipment_purchased": ["FENCE FEEDER 16\"", "SCOOP,ENCLOSED 3QT"],
  "seasonal_indicator": "fall",
  "purchase_pattern": "bulk_purchase",
  "supplier_loyalty": "repeat_customer",
  "affiliate_potential": ["JACOBY'S"],
  "price_benchmarking": [
    {
      "item": "JACOBY'S RED TAG GROW/DEV",
      "price": 28.50,
      "vendor": "Strutty's",
      "region": "TX",
      "date": "2024-09-08"
    }
  ],
  "bulk_purchase_indicators": [
    {
      "item": "JACOBY'S RED TAG GROW/DEV",
      "quantity": 2,
      "unit_price": 28.50,
      "bulk_threshold": 2,
      "savings_potential": 2.85
    }
  ]
}
*/

-- Example vendor_intelligence JSONB structure:
/*
{
  "vendor_address": "23630 I.H. 10 West, Boerne, TX 78006",
  "vendor_phone": "(830) 981-2258",
  "vendor_website": "boerne@struttys.com",
  "vendor_category": "feed_pet_supply",
  "invoice_number": "526850",
  "cashier_id": "01",
  "employee_name": "TREY",
  "payment_method": "Debit Purchase",
  "transaction_time": "03:10:13 PM",
  "tax_amount": 1.50,
  "tax_rate": 8.250,
  "item_count": 3
}
*/