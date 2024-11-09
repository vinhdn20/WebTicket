using Common;
using Repositories.Entities;
using Repositories.Interfaces;
using Repositories.Models;
using Services.Services.Interfaces;
using System.Linq.Expressions;

namespace Services.Services.Implement
{
    public class VeService : BasicOperationService<ThongTinVe>, IVeService
    {
        public VeService(IDBRepository repository) : base(repository)
        {
        }

        public async Task<TableInfo<ThongTinVe>> Filter(TablePageParameter pageParameter)
        {
            var dbQueryParameter = InitQueryParameter(pageParameter);
            dbQueryParameter.IncludedPropertyList = new List<string> { "AGCustomer", "Customer", "Card" };
            var thongTinVe = await _repository.GetAllWithPagingAsync(dbQueryParameter);
            return thongTinVe;
        }

        protected override Expression<Func<ThongTinVe, bool>> CreateFilter(TablePageParameter tablePageParameter)
        {
            Expression<Func<ThongTinVe, bool>> filterExpression = FillterBuilder.True<ThongTinVe>();
            var filters = tablePageParameter.Filters;
            if (!filters.Any())
            {
                return filterExpression;
            }

            if (tablePageParameter.Filters.Any())
            {
                var stringProperties = typeof(ThongTinVe)
        .GetProperties()
        .Where(prop => prop.PropertyType == typeof(string))
        .ToList();

                foreach (var prop in stringProperties)
                {
                    var filterKey = prop.Name;
                    if (filters.ContainsKey(filterKey))
                    {
                        var values = filters[filterKey].Select(s => s.ToLower()).ToList();

                        // Sử dụng Expression để xây dựng điều kiện lọc
                        var parameter = Expression.Parameter(typeof(ThongTinVe), "entity");
                        var property = Expression.Property(parameter, prop.Name);
                        var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes);
                        var lowerCaseProperty = Expression.Call(property, toLowerMethod);

                        var containsMethod = typeof(List<string>).GetMethod("Contains", new[] { typeof(string) });
                        var valuesExpression = Expression.Constant(values);
                        var containsExpression = Expression.Call(valuesExpression, containsMethod, lowerCaseProperty);

                        var lambda = Expression.Lambda<Func<ThongTinVe, bool>>(containsExpression, parameter);
                        filterExpression = filterExpression.And(lambda);
                    }
                }
            }

            var dateTimeProperties = typeof(ThongTinVe)
        .GetProperties()
        .Where(prop => prop.PropertyType == typeof(DateTime))
        .ToList();


            foreach (var prop in dateTimeProperties)
            {
                var filterKey = prop.Name;
                if (filters.ContainsKey(filterKey) && DateTime.TryParse(filters[filterKey].FirstOrDefault(), out var dateValue))
                {
                    var parameter = Expression.Parameter(typeof(ThongTinVe), "entity");
                    var property = Expression.Property(parameter, prop.Name);
                    var dateConstant = Expression.Constant(dateValue);

                    // So sánh bằng với giá trị DateTime
                    var equalsExpression = Expression.Equal(property, dateConstant);

                    var lambda = Expression.Lambda<Func<ThongTinVe, bool>>(equalsExpression, parameter);
                    filterExpression = filterExpression.And(lambda);
                }
            }

            return filterExpression;
        }

        protected override Sorter<ThongTinVe, object> MapSortColumn(string sortKey)
        {
            Sorter<ThongTinVe, object> sorter = new Sorter<ThongTinVe, object>();
            switch ((sortKey ?? "").ToLower())
            {
                //case Constants.ThongTinVe.:
                //    sorter.SortBy = s => s.User.DisplayName;
                //    sorter.ThenSortBy = s => s.User.Code;
                //    break;
                //case Constants.TableSortColumn.Code:
                default:
                    sorter.SortBy = s => s.ModifiedTime;
                    sorter.ThenSortBy = s => s.CreatedTime;
                    break;
            }
            return sorter;
        }
    }
}
